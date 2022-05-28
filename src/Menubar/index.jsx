import Style from "./Menubar.module.css";
import { onMount, onCleanup, createSignal, createEffect } from "solid-js";
import {
	ISOCodeList,
	Endonyms,
	EndonymToCode,
} from "../Localization/Languages";
import { ParseFileString } from "../FileManager";

const allViews = ["crease pattern", "simulator", "diagram"];
let inputFileRef;

const T = str => str;

const Hamburger = (props) => <ul>
	<li>
		<svg
			class="hamburger-svg" 
			width="1.3rem" 
			height="1.3rem" 
			viewBox="0 0 20 20"
			stroke-width="4"
			stroke-linecap="round" 
			stroke={props.darkMode() ? "#ccc" : "black"}>
			<line x1="3" y1="4" x2="17" y2="4"/>
			<line x1="3" y1="10" x2="17" y2="10"/>
			<line x1="3" y1="16" x2="17" y2="16"/>
		</svg>
		{props.children}
	</li>
</ul>;

const Navbar = (props) => <ul>
	<li>{T("file")}
		<ul>
			<li onClick={props.newFile}>{T("new")}</li>
			<li onClick={() => inputFileRef.click()}>{T("open")}</li>
			<li onClick={props.saveFile}>{T("save")}</li>
		</ul>
	</li>
	<li>{T("view")}
		<ul>
			<For each={allViews}>{(view) =>
				<li
					class={`menu-view-${view}`}
					highlighted={props.views().includes(view)}
					onClick={() => props.onClickView(view)}>{view}</li>
			}</For>
			<hr />
			<li
				onClick={() => props.setShowTerminal(!props.showTerminal())}
				highlighted={props.showTerminal().toString()}
			>{T("show terminal")}</li>
			<li
				onClick={() => props.setShowPanels(!props.showPanels())}
				highlighted={props.showPanels().toString()}
			>{T("show panels")}</li>
		</ul>
	</li>
	<li>{T("preferences")}
		<ul>
			<li
				onClick={() => props.setDarkMode(!props.darkMode())}
				highlighted={props.darkMode().toString()}
			>{T("dark mode")}</li>
		</ul>
	</li>
	<li>{T(Endonyms[props.language()])}
		<ul>
			<For each={ISOCodeList.map(code => Endonyms[code])}>{(language) =>
				<li
					onClick={() => props.setLanguage(EndonymToCode[language])}
					highlighted={Endonyms[props.language()] === language}
				>{language}</li>}
			</For>
		</ul>
	</li>
	<li onClick={() => {}}>{T("about")}</li>
</ul>;


const Menubar = (props) => {

	const onClickView = (newView) => {
		const currentViews = props.views();
		if (currentViews.includes(newView)) {
			return props.setViews(currentViews.filter(a => a !== newView));
		} else {
			currentViews.push(newView);
			return props.setViews([...currentViews]);
		}
	};

	const fileDialogDidLoad = (string) => {
		const result = ParseFileString(string);
		if (result.error) { return props.setErrorMessage(result.error); }
		props.loadFile(result);
	};

	const fileDidLoad = (event) => {
		event.stopPropagation();
		event.preventDefault();
		// file reader and its callbacks
		const reader = new FileReader();
		reader.onerror = error => console.warn("FileReader error", error);
		reader.onabort = abort => console.warn("FileReader abort", abort);
		reader.onload = loadEvent => fileDialogDidLoad(loadEvent.target.result);
		if (event.target.files.length) {
			return reader.readAsText(event.target.files[0]);
		}
		console.warn("FileReader no file selected");
	};

	const Nav = () => <Navbar
		newFile={props.newFile}
		saveFile={props.saveFile}
		views={props.views}
		darkMode={props.darkMode}
		setDarkMode={props.setDarkMode}
		language={props.language}
		setLanguage={props.setLanguage}
		showPanels={props.showPanels}
		setShowPanels={props.setShowPanels}
		showTerminal={props.showTerminal}
		setShowTerminal={props.setShowTerminal}
		onClickView={onClickView}
	/>;

	return (<>
		<nav class={Style.Menubar}>
			<Show when={props.mobileLayout()}>
				<Hamburger darkMode={props.darkMode}>
					<Nav />
				</Hamburger>
			</Show>
			<Show when={!props.mobileLayout()}>
				<Nav />
			</Show>
			<input
				type="file"
				id="file"
				ref={inputFileRef}
				onChange={fileDidLoad.bind(this)} />
		</nav>
	</>);
};

export default Menubar;