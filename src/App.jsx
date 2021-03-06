import { createSignal, createEffect, onMount, onCleanup } from "solid-js";
import ear from "rabbit-ear";
import Style from "./App.module.css";
import Menubar from "./Menubar";
import Toolbar from "./Toolbar";
import Panels from "./Panels";
import Terminal from "./Terminal";
import CP from "./CP";
import Diagram from "./Diagram";
import Simulator from "./Simulator";
// popups
import NewFile from "./Popups/NewFile";
import Examples from "./Popups/Examples";
import Error from "./Popups/Error";
// file i/o
import {
	localStorageVersion,
	emptyPreferences,
	getPreference,
	setPreference,
} from "./LocalStorage";
import {
	makeFOLDFile,
	downloadFile,
	loadFOLDMetaAndFrames,
} from "./FileManager";
import DragAndDrop from "./FileManager/DragAndDrop";
// graph modification
import MakeFoldedForm from "./FOLD/MakeFoldedForm";
// SVG touches turn into function parameters, solutions, commands
import MakeParams from "./Compute/MakeParams";
import MakeSolutions from "./Compute/MakeSolutions";
import MakeToolStep from "./Compute/MakeToolStep";
import ClassifySolutions from "./Compute/ClassifySolutions";
import MakeCommand from "./Compute/MakeCommand";
import ExecuteCommand from "./Compute/ExecuteCommand";
// various
import {
	addKeySetTrue,
	removeKey,
	appendNearest,
} from "./Helpers";
// starting FOLD file
// import startFOLD from "./Files/square.fold?raw";
import startFOLD from "./Files/example-sequence.fold?raw";
// css style
import "./SVG/cp.css";
import "./SVG/diagram.css";
import "./SVG/layers.css";

const App = () => {
	// load preferences. these are used to populate the initial state of signals.
	let preferences = getPreference();
	if (preferences == null || preferences.version !== localStorageVersion) {
		// todo: be smarter about replacing existing preferences if version differs.
		preferences = emptyPreferences();
		setPreference([], preferences);
	}
	// the data models. even if the user is only making one crease pattern, the data is
	// stored in an array of FOLD objects (fileFrames) which represents the diagram sequence.
	// fileFrames is the main data source. Modifications to the crease pattern happen
	// by modifying the current index in fileFrames, and changes to fileFrames will
	// update cp(), where cp() is the current selected diagram step.
	const [fileMeta, setFileMeta] = createSignal({}); // object
	const [fileFrames, setFileFrames] = createSignal([{}]); // FOLD-object[]
	const [fileFrameIndex, setFileFrameIndex] = createSignal(0); // int
	const [cp, setCP] = createSignal({}); // FOLD-object
	const [foldedForm, setFoldedForm] = createSignal(MakeFoldedForm({})); // FOLD-object
	// the 2D bounds of the cp and folded forms as {x,y,width,height} rectangles
	const [cpRect, setCPRect] = createSignal(); // object
	const [foldedFormRect, setFoldedFormRect] = createSignal(); // object
	// app state, windows, layout
	const [tool, setTool] = createSignal("inspect"); // string
	const [views, setViews] = createSignal(preferences.views); // string[]
	const [language, setLanguage] = createSignal(preferences.language); // string
	const [darkMode, setDarkMode] = createSignal(preferences.darkMode); // boolean
	const [mobileLayout, setMobileLayout] = createSignal(window.innerWidth < window.innerHeight); // boolean
	const [showPanels, setShowPanels] = createSignal(true); // boolean
	const [showTerminal, setShowTerminal] = createSignal(false); // boolean
	const [showDiagramInstructions, setShowDiagramInstructions] = createSignal(preferences.showDiagramInstructions); // boolean
	const [cpViewBox, setCPViewBox] = createSignal();
	const [diagramViewBox, setDiagramViewBox] = createSignal();
	// popups
	const [errorMessage, setErrorMessage] = createSignal(); // object
	const [showNewPopup, setShowNewPopup] = createSignal(false); // boolean
	const [showExamplesPopup, setShowExamplesPopup] = createSignal(false);
	// origami simulator
	const [simulatorOn, setSimulatorOn] = createSignal(preferences.simulator.on); // boolean
	const [simulatorShowTouches, setSimulatorShowTouches] = createSignal(preferences.simulator.showTouches); // boolean
	const [simulatorStrain, setSimulatorStrain] = createSignal(preferences.simulator.strain); // boolean
	const [simulatorFoldAmount, setSimulatorFoldAmount] = createSignal(0); // float (0.0-1.0)
	const [simulatorShowShadows, setSimulatorShowShadows] = createSignal(preferences.simulator.shadows); // boolean
	// keyboard
	const [keyboardState, setKeyboardState] = createSignal({}); // object
	// touch events
	const [cpPointer, setCPPointer] = createSignal(); // MouseEvent
	const [cpPresses, setCPPresses] = createSignal([]); // MouseEvent[]
	const [cpDrags, setCPDrags] = createSignal([]); // MouseEvent[]
	const [cpReleases, setCPReleases] = createSignal([]); // MouseEvent[]
	const [diagramPointer, setDiagramPointer] = createSignal(); // MouseEvent
	const [diagramPresses, setDiagramPresses] = createSignal([]); // MouseEvent[]
	const [diagramDrags, setDiagramDrags] = createSignal([]); // MouseEvent[]
	const [diagramReleases, setDiagramReleases] = createSignal([]); // MouseEvent[]
	const [simulatorPointers, setSimulatorPointers] = createSignal([]); // object
	// result of touch events
	// as the number of presses/drags/releases grow, the input parameters for the current
	// operation are compiled in cpParams, and, as soon as is possible the solutions
	// are calculated to preview the solutions, stored in cpSolutions. as touches continue
	// and solutions are shown, we need to know when the final touch happens, the cpToolStep
	// stores two numbers: [current, total]. when current==total the operation is completed,
	// the cpCommandQueue is populated with a command, which triggers the editor to make the modification
	const [cpParams, setCPParams] = createSignal([]); // any[]
	const [cpSolutions, setCPSolutions] = createSignal([]); // Line[]
	const [cpToolStep, setCPToolStep] = createSignal([]); // [int, int]
	const [cpCommandQueue, setCPCommandQueue] = createSignal(); // todo
	const [diagramParams, setDiagramParams] = createSignal([]); // any[]
	const [diagramSolutions, setDiagramSolutions] = createSignal([]); // Line[]
	const [diagramToolStep, setDiagramToolStep] = createSignal([]); // [int, int]
	const [diagramCommandQueue, setDiagramCommandQueue] = createSignal(); // todo
	// todo: build this out to be an array of FOLD objects alongside these strings
	const [historyText, setHistoryText] = createSignal(); // string
	// tool settings
	const [vertexSnapping, setVertexSnapping] = createSignal(true); // boolean
	const [toolAssignmentDirection, setToolAssignmentDirection] = createSignal("mountain-valley"); // string
	// todo: remove in production probably
	const [showDebugSVGLayer, setShowDebugSVGLayer] = createSignal(preferences.debug.showSVGLayer); // boolean
	const [showDebugPanel, setShowDebugPanel] = createSignal(preferences.debug.showPanel); // boolean
	/**
	 * @description this will detect if the user has made a diagram (multiple frames)
	 * or a single crease pattern, and export a file properly formatted as such.
	 */
	const saveFile = (event) => {
		const foldFile = makeFOLDFile(fileMeta(), fileFrames());
		downloadFile(JSON.stringify(foldFile));
	};
	/**
	 * @description the main entrypoint for loading a file.
	 * this must be a FOLD object, but it can be either a singleModel or diagram:
	 * - singleModel (one FOLD object with only top-level data)
	 * - diagram (one FOLD object with file_frames:[])
	 */
	const loadFile = (fold) => {
		const { metadata, file_frames } = loadFOLDMetaAndFrames(fold);
		setFileMeta(metadata);
		setFileFrames(file_frames);
		setFileFrameIndex(file_frames.length - 1);
		// todo: do we need to clear touches?
	};
	// keyboard events
	// maintain one keyboard object which contains a key:value of all keys pressed,
	// and an "event" key which describes the most recent event.
	const onkeydown = (e) => setKeyboardState(addKeySetTrue(keyboardState(), e.key))
	const onkeyup = (e) => setKeyboardState(removeKey(keyboardState(), e.key));
	// window events
	// watch for a resize event, switch to mobile layout if width < height
	const onresize = () => setMobileLayout(window.innerWidth < window.innerHeight);
	// other
	const resetViewBox = () => {
		setCPViewBox(ear.graph.svg.getViewBox(cp()));
		setDiagramViewBox(ear.graph.svg.getViewBox(foldedForm()));
	};
	//
	// effect hooks
	//
	// when a new file is loaded, or when the current diagram advances the index,
	// set the cp and the folded form (make the folded form), re-calc bounding rects
	createEffect(() => {
		const frames = fileFrames();
		const index = fileFrameIndex();
		if (index < frames.length) {
			const cp = frames[index];
			const foldedForm = MakeFoldedForm(cp);
			// todo: errors if something goes wrong
			setCP(cp);
			setCPRect(ear.rect.fromPoints(cp.vertices_coords)); // todo: redundant
			setCPViewBox(ear.graph.svg.getViewBox(cp));         // todo: redundant
			setFoldedForm(foldedForm);
			setFoldedFormRect(ear.rect.fromPoints(foldedForm.vertices_coords));
			setDiagramViewBox(ear.graph.svg.getViewBox(foldedForm));
		}
	});
	// watch the keyboard for changes, select by "up" "down" events and the key involved:
	createEffect(() => {
		const keyboard = keyboardState();
		if (keyboard.event && keyboard.event.type === "up") {
			switch (keyboard.event.key) {
				case "\`": setShowTerminal(true); break;
				case "Escape":
					setShowTerminal(false);
					setCPPresses([]);
					setCPDrags([]);
					setCPReleases([]);
					setDiagramPresses([]);
					setDiagramDrags([]);
					setDiagramReleases([]);
					// consider also hiding any visible popups...
					break;
				default: break;
			}
		}
	});
	// if the tool (and only the tool) changes, reset all touch parameters
	// todo: oh no, this needs to fire before the MakeCommand effect.
	// running axiom 3 (non-parallel), switching to axiom 1/2/4 executes the new tool with old params.
	createEffect(() => {
		tool();
		setCPPresses([]);
		setCPDrags([]);
		setCPReleases([]);
		setDiagramPresses([]);
		setDiagramDrags([]);
		setDiagramReleases([]);
		setCPCommandQueue();
		setCPPresses([]);
		setCPDrags([]);
		setCPReleases([]);
		setCPToolStep([]);
		setCPParams([]);
		setCPSolutions([]);
		setDiagramCommandQueue();
		setDiagramPresses([]);
		setDiagramDrags([]);
		setDiagramReleases([]);
		setDiagramToolStep([]);
		setDiagramParams([]);
		setDiagramSolutions([]);
		// setSimulatorPointers([]);
	});
	// when you move off of the simulator, but the simulator is still mirror-highlighting
	// on the CP/diagram, clear the simulator highlights so things aren't too confusing.
	createEffect(() => {
		cpPointer();
		diagramPointer();
		setSimulatorPointers([]);
	});
	// SVG touch events and modification of the crease pattern/folded form.
	// 1. params: SVG pointer/presses/drags/releases will create function parameters (points, lines)
	// 2. solutions: when params are available, run the operation to generate solutions
	// 3. toolStep: step N out of Total #. when N == Total the operation is complete.
	// 4. classify: classify multiple solutions (nearest to mouse) if multiple exist.
	// 5. command: when the last step is reached, append the operation to the execution queue.
	createEffect(() => {
		const t = tool();
		const pointer = cpPointer();
		const presses = cpPresses();
		const drags = cpDrags();
		const releases = cpReleases();
		const snap = vertexSnapping();
		const params = MakeParams({tool: t, pointer, presses, drags, releases, vertexSnapping: snap });
		const solutions = MakeSolutions({ tool: t, pointer, params });
		const toolStep = MakeToolStep({ tool: t, pointer, presses, releases, solutions });
		ClassifySolutions({ tool: t, pointer, solutions, toolStep })
		const command = MakeCommand({ which: "cp", tool: t, params, solutions, toolStep });
		setCPParams(params);
		setCPSolutions(solutions);
		setCPToolStep(toolStep);
		setCPCommandQueue(command);
	});
	createEffect(() => {
		const t = tool();
		const pointer = diagramPointer();
		const presses = diagramPresses();
		const drags = diagramDrags();
		const releases = diagramReleases();
		const snap = vertexSnapping();
		const params = MakeParams({tool: t, pointer, presses, drags, releases, vertexSnapping: snap });
		const solutions = MakeSolutions({ tool: t, pointer, params });
		const toolStep = MakeToolStep({ tool: t, pointer, presses, releases, solutions });
		ClassifySolutions({ tool: t, pointer, solutions, toolStep })
		const command = MakeCommand({ which: "diagram", tool: t, params, solutions, toolStep });
		setDiagramParams(params);
		setDiagramSolutions(solutions);
		setDiagramToolStep(toolStep);
		setDiagramCommandQueue(command);
	});
	// when a command is available on the queue, modify the FOLD object, clear touches.
	createEffect(() => {
		const command = cpCommandQueue();
		if (!command) { return; }
		// clear touches
		setCPCommandQueue();
		setCPPresses([]);
		setCPDrags([]);
		setCPReleases([]);
		setCPToolStep([]);
		setCPParams([]);
		setCPSolutions([]);
		const text = ExecuteCommand(command, {
			setViewBox: setCPViewBox,
			resetViewBox,
		});
		if (text) { setHistoryText([historyText(), text].join("\n")); }
	});
	createEffect(() => {
		const command = diagramCommandQueue();
		if (!command) { return; }
		// clear touches
		setDiagramCommandQueue();
		setDiagramPresses([]);
		setDiagramDrags([]);
		setDiagramReleases([]);
		setDiagramToolStep([]);
		setDiagramParams([]);
		setDiagramSolutions([]);
		const text = ExecuteCommand(command, {
			setViewBox: setDiagramViewBox,
			resetViewBox,
		});
		if (text) { setHistoryText([historyText(), text].join("\n")); }
	});
	// Local Storage
	// when any of these change, write to the local storage immediately,
	// ensuring the preferences remain always updated.
	createEffect(() => setPreference(["views"], views()));
	createEffect(() => setPreference(["language"], language()));
	createEffect(() => setPreference(["darkMode"], darkMode()));
	createEffect(() => setPreference(["simulator", "on"], simulatorOn()));
	createEffect(() => setPreference(["simulator", "showTouches"], simulatorShowTouches()));
	createEffect(() => setPreference(["simulator", "strain"], simulatorStrain()));
	createEffect(() => setPreference(["simulator", "shadows"], simulatorShowShadows()));

	onMount(() => {
		window.addEventListener("resize", onresize);
		window.addEventListener("keydown", onkeydown);
		window.addEventListener("keyup", onkeyup);
		// on startup, load a file
		loadFile(JSON.parse(startFOLD));
	});
	onCleanup(() => {
		window.removeEventListener("resize", onresize);
		window.removeEventListener("keydown", onkeydown);
		window.removeEventListener("keyup", onkeyup);
	});

	return (
		<div class={`${Style.App} ${darkMode() ? "dark-mode" : "light-mode"}`}>
			<Menubar
				views={views}
				setViews={setViews}
				darkMode={darkMode}
				setDarkMode={setDarkMode}
				language={language}
				setLanguage={setLanguage}
				showPanels={showPanels}
				setShowPanels={setShowPanels}
				showTerminal={showTerminal}
				setShowTerminal={setShowTerminal}
				setShowNewPopup={setShowNewPopup}
				setShowExamplesPopup={setShowExamplesPopup}
				loadFile={loadFile}
				saveFile={saveFile}
				mobileLayout={mobileLayout}
				setErrorMessage={setErrorMessage}
				// debug
				showDebugPanel={showDebugPanel}
				setShowDebugPanel={setShowDebugPanel}
			/>
			<Toolbar
				tool={tool}
				setTool={setTool}
				views={views}
			/>
			<div class={Style.Main}>
				<div class={`${Style.Views} View-Items-${views().length} ${mobileLayout() ? Style.Column : Style.Row}`}>
					<Show when={views().includes("crease pattern")}>
						<CP
							tool={tool}
							views={views}
							showPanels={showPanels}
							showTerminal={showTerminal}
							// data
							origami={cp}
							rect={cpRect}
							cpViewBox={cpViewBox}
							setCPViewBox={setCPViewBox}
							// events
							pointer={cpPointer}
							presses={cpPresses}
							drags={cpDrags}
							releases={cpReleases}
							setPointer={setCPPointer}
							setPresses={setCPPresses}
							setDrags={setCPDrags}
							setReleases={setCPReleases}
							keyboardState={keyboardState}
							simulatorPointers={simulatorPointers}
							simulatorShowTouches={simulatorShowTouches}
							// calculations
							cpParams={cpParams}
							cpSolutions={cpSolutions}
							// tool settings
							vertexSnapping={vertexSnapping}
							// remove
							showDebugSVGLayer={showDebugSVGLayer}
						/>
					</Show>
					<Show when={views().includes("simulator")}>
						<Simulator
							cp={cp}
							tool={tool}
							views={views}
							darkMode={darkMode}
							showPanels={showPanels}
							// simulator
							simulatorOn={simulatorOn}
							simulatorShowTouches={simulatorShowTouches}
							simulatorStrain={simulatorStrain}
							simulatorFoldAmount={simulatorFoldAmount}
							simulatorShowShadows={simulatorShowShadows}
							// events
							setSimulatorPointers={setSimulatorPointers}
						/>
					</Show>
					<Show when={views().includes("diagram")}>
						<Diagram
							tool={tool}
							views={views}
							showPanels={showPanels}
							showTerminal={showTerminal}
							// data
							origami={foldedForm}
							rect={foldedFormRect}
							diagramViewBox={diagramViewBox}
							setDiagramViewBox={setDiagramViewBox}
							// events
							pointer={diagramPointer}
							presses={diagramPresses}
							drags={diagramDrags}
							releases={diagramReleases}
							setPointer={setDiagramPointer}
							setPresses={setDiagramPresses}
							setDrags={setDiagramDrags}
							setReleases={setDiagramReleases}
							keyboardState={keyboardState}
							// calculations
							diagramParams={diagramParams}
							diagramSolutions={diagramSolutions}
							// tool settings
							showDiagramInstructions={showDiagramInstructions}
							vertexSnapping={vertexSnapping}
							// remove
							showDebugSVGLayer={showDebugSVGLayer}
						/>
					</Show>
				</div>

				{/* panels */}
				<div class={Style.FloatingPanelContainer}>
					<Show when={showPanels()}>
						<Panels
							tool={tool}
							views={views}
							language={language}
							cp={cp}
							darkMode={darkMode}
							fileMeta={fileMeta}
							setFileMeta={setFileMeta}
							fileFrames={fileFrames}
							setFileFrames={setFileFrames}
							fileFrameIndex={fileFrameIndex}
							setFileFrameIndex={setFileFrameIndex}
							showPanels={showPanels}
							setShowPanels={setShowPanels}
							showDiagramInstructions={showDiagramInstructions}
							setShowDiagramInstructions={setShowDiagramInstructions}
							// debug
							showDebugPanel={showDebugPanel}
							// simulator
							simulatorOn={simulatorOn}
							setSimulatorOn={setSimulatorOn}
							simulatorStrain={simulatorStrain}
							setSimulatorStrain={setSimulatorStrain}
							simulatorFoldAmount={simulatorFoldAmount}
							setSimulatorFoldAmount={setSimulatorFoldAmount}
							simulatorShowTouches={simulatorShowTouches}
							setSimulatorShowTouches={setSimulatorShowTouches}
							simulatorShowShadows={simulatorShowShadows}
							setSimulatorShowShadows={setSimulatorShowShadows}
							// events
							cpPointer={cpPointer}
							cpPresses={cpPresses}
							cpDrags={cpDrags}
							cpReleases={cpReleases}
							cpParams={cpParams}
							cpToolStep={cpToolStep}
							diagramPointer={diagramPointer}
							diagramPresses={diagramPresses}
							diagramDrags={diagramDrags}
							diagramReleases={diagramReleases}
							diagramParams={diagramParams}
							diagramToolStep={diagramToolStep}
							simulatorPointers={simulatorPointers}
							keyboardState={keyboardState}
							//
							cpSolutions={cpSolutions}
							diagramSolutions={diagramSolutions}
							// remove
							showDebugSVGLayer={showDebugSVGLayer}
							setShowDebugSVGLayer={setShowDebugSVGLayer}
							// tool settings
							toolAssignmentDirection={toolAssignmentDirection}
							setToolAssignmentDirection={setToolAssignmentDirection}
							// zoom
							resetViewBox={resetViewBox}
						/>
					</Show>
					<div
						class={Style.CollapseButton}
						onClick={() => setShowPanels(!showPanels())}>
						<svg width="100%" height="100%" viewBox="0 0 10 10">
							<polygon
								fill={darkMode() ? "#ccc" : "white"}
								points={showPanels() ? "3,3 3,7 7,5" : "7,3 7,7 3,5"} />
						</svg>
					</div>
				</div>
			</div>

			<Show when={showTerminal()}>
				<Terminal
					historyText={historyText}
					setHistoryText={setHistoryText}
				/>
			</Show>

			{/* pop-ups */}
			<Show when={showNewPopup()}>
				<NewFile
					language={language}
					loadFile={loadFile}
					clickOff={() => setShowNewPopup(false)}
				/>
			</Show>
			<Show when={showExamplesPopup()}>
				<Examples
					language={language}
					loadFile={loadFile}
					clickOff={() => setShowExamplesPopup(false)}
				/>
			</Show>
			<Show when={errorMessage()}>
				<Error
					language={language}
					title={errorMessage().title}
					header={errorMessage().header}
					body={errorMessage().body}
					clickOff={() => setErrorMessage(undefined)}
				/>
			</Show>
			<DragAndDrop
				loadFile={loadFile}
				setErrorMessage={setErrorMessage}
			/>
		</div>
	);
};

export default App;
