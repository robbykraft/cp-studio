import { createSignal, createEffect } from "solid-js";
import Panel from "../Panel";
import { stringifyPoint } from "../../Helpers";

// "file_spec": 1.1,
// "file_classes": ["diagrams"],
// "file_author": "",
// "file_title": "",
// "file_frames": [],

const FilePanel = (props) => {

	const [isCollapsed, setIsCollapsed] = createSignal(false);

	const getFileMetaValue = (key) => props.fileMeta()[key]
		? props.fileMeta()[key]
		: "";

	const modifyFileMeta = (key, value) => {
		const meta = props.fileMeta();
		meta[key] = value;
		props.setFileMeta(meta);
	};

	return (
		<Panel
			title="File"
			isCollapsed={isCollapsed}
			setIsCollapsed={setIsCollapsed}>
			<div class="flex-row left">
				<p>name:</p>
				<input
					type="text"
					value={getFileMetaValue("file_title")}
					oninput={e => modifyFileMeta("file_title", e.target.value)}
				/>
			</div>
			<div class="flex-row left">
				<p>designer:</p>
				<input
					type="text"
					value={getFileMetaValue("file_author")}
					oninput={e => modifyFileMeta("file_author", e.target.value)}
				/>
			</div>
			<hr />
			<div class="flex-row left">
				<p>version: <b>{getFileMetaValue("file_spec")}</b></p>
			</div>
			<div class="flex-row left">
				<p>kind: <b>{props.fileFrames().length === 1
					? "crease pattern"
					: "diagrams"}</b></p>
			</div>
				<p>233 vertices</p>
				<p>512 edges</p>
				<p>192 faces</p>
		</Panel>
	);
};

export default FilePanel;