/* prettier-ignore */ import express	from "express";
/* prettier-ignore */ import bodyParser	from "body-parser";
/* prettier-ignore */ import * as tslog	from "tslog";
/* prettier-ignore */ import * as child	from "child_process";

const console = new tslog.Logger();

export const mini_shell = async (
	proc: child.ChildProcessWithoutNullStreams
) => {
	const app = express();

	app.use(
		bodyParser.urlencoded({
			extended: true,
		})
	);
	app.use(bodyParser.json());
	app.post("/", async (req, res) => {
		if (req.body && req.body["command"]) {
			proc.stdin.write(`${req.body["command"]}\n`);
			console.info(`shell> ${req.body["command"]}`);
		}
		res.send(req.body["command"]);
	});
	app.listen(8080, "127.0.0.1", () => {
		console.info("minishell server start");
	});
};
