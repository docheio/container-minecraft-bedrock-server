/* prettier-ignore */ import express	from "express";
/* prettier-ignore */ import bodyParser	from "body-parser";
/* prettier-ignore */ import * as child	from "child_process";

const app = express();

export const mini_shell = async (proc: child.ChildProcessWithoutNullStreams) => {
	app.use(
		bodyParser.urlencoded({
			extended: true,
		})
	);
	app.use(bodyParser.json());
	app.post("/", (req, res) => {
		proc.stdin.write(`${req.body["command"]}\n`);
		res.send("");
	});
	app.listen(8000, "127.0.0.1", () => {
		console.info("mnishell server start");
	});
};
