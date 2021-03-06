import Style from "./SimulatorPanel.module.css";
import { createSignal, createEffect } from "solid-js";
import Panel from "../Panel";
import {
	getPreference,
	setPreference,
} from "../../LocalStorage";
import Dict from "../../Localization/dictionary.json";

const preferenceCollapseKeys = ["panels", "simulatorPanelCollapsed"];

const SimulatorPanel = (props) => {
	const [isCollapsed, setIsCollapsed] = createSignal(getPreference(preferenceCollapseKeys));
	createEffect(() => setPreference(preferenceCollapseKeys, isCollapsed()));

	// translation
	const [T, setT] = createSignal(s => s);
	createEffect(() => {
		const newT = (s) => Dict[s] && Dict[s][props.language()] ? Dict[s][props.language()] : s;
		setT(() => newT);
	});

	return (
		<Panel
			title={T()("simulator")}
			isCollapsed={isCollapsed}
			setIsCollapsed={setIsCollapsed}>
			<div class={Style.PanelSimulator}>
				<div class="flex-row">
					<input
						type="checkbox"
						class="high-energy"
						id="checkbox-simulator-on"
						checked={props.simulatorOn()}
						oninput={e => props.setSimulatorOn(e.target.checked)}
					/><label for="checkbox-simulator-on">{T()("on")}</label>
					<input
						type="range"
						min="0.0"
						max="1.0"
						value={props.simulatorFoldAmount()}
						step="0.001"
						disabled={!props.simulatorOn()}
						oninput={e => props.setSimulatorFoldAmount(e.target.value)}
					/>
				</div>
				<div>
					<input
						type="checkbox"
						id="checkbox-simulator-strain"
						checked={props.simulatorStrain()}
						oninput={e => props.setSimulatorStrain(e.target.checked)}
					/><label for="checkbox-simulator-strain">{T()("strain")}</label>
				</div>
				<div>
					<input
						type="checkbox"
						id="checkbox-simulator-highlight"
						checked={props.simulatorShowTouches()}
						oninput={e => props.setSimulatorShowTouches(e.target.checked)}
					/><label for="checkbox-simulator-highlight">show touches</label>
				</div>
				<div>
					<input
						type="checkbox"
						id="checkbox-simulator-shadows"
						checked={props.simulatorShowShadows()}
						oninput={e => props.setSimulatorShowShadows(e.target.checked)}
					/><label for="checkbox-simulator-shadows">shadows</label>
				</div>
			</div>
		</Panel>
	);
};

export default SimulatorPanel;
