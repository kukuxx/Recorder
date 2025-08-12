/*
js壓縮合併用的nodejs程式碼

源碼內支援編譯指令（去掉*前後的空格）：
	```
	/ *=:=* /
		源碼時執行的js程式碼
	/ *<@
		編譯後執行的js程式碼
	@>* /
	```
*/

var fs = require("fs");
var crypto = require('crypto');
var { minify } = require("terser");
var i18nRun = require("./package-i18n.js");

console.log("\x1B[32m%s\x1B[0m", "請選擇操作：(1)生成語言包 (2)壓縮js (3)生成npm包 (回車)所有");
process.stdin.on('data', async function (input) {
	input = input.toString().trim();
	try {
		if (!input) {
			// 執行所有步驟
			console.log("執行所有步驟...");
			i18nRun();
			await Run_minify();
			Run_npm();
		} else if (input == "1") {
			i18nRun();
		} else if (input == "2") {
			await Run_minify();
		} else if (input == "3") {
			Run_npm();
		}
		console.log("\x1B[33m%s\x1B[0m", "程序已退出");
		process.exit();
	} catch (error) {
		console.error("\x1B[31m%s\x1B[0m", "執行過程中發生錯誤:", error);
		process.exit(1);
	}
});




async function Run_minify() {
	deleteFolder("../dist");
	!fs.existsSync("../dist") && fs.mkdirSync("../dist");
	fs.mkdirSync("../dist/engine");
	fs.mkdirSync("../dist/extensions");
	fs.mkdirSync("../dist/i18n");
	fs.mkdirSync("../dist/app-support");

	console.log("\x1B[33m%s\x1B[0m", "開始minify處理文件...");

	try {
		await minifyFile("../recorder.mp3.min.js", ["recorder-core.js", "engine/mp3.js", "engine/mp3-engine.js"]);
		await minifyFile("../recorder.wav.min.js", ["recorder-core.js", "engine/wav.js"]);

		await minifyFile("../dist/recorder-core.js", ["recorder-core.js"]);
		await minifyFile("../dist/engine/mp3.js", ["engine/mp3.js", "engine/mp3-engine.js"]);
		await minifyFile("../dist/engine/wav.js", ["engine/wav.js"]);
		await minifyFile("../dist/engine/pcm.js", ["engine/pcm.js"]);
		await minifyFile("../dist/engine/g711x.js", ["engine/g711x.js"]);

		await minifyFile("../dist/engine/beta-webm.js", ["engine/beta-webm.js"]);
		await minifyFile("../dist/engine/beta-ogg.js", ["engine/beta-ogg.js", "engine/beta-ogg-engine.js"]);
		await minifyFile("../dist/engine/beta-amr.js", ["engine/beta-amr.js", "engine/beta-amr-engine.js", "engine/wav.js"]);

		const appSupportFiles = fs.readdirSync("app-support");
		for (const file of appSupportFiles) {
			await minifyFile("../dist/app-support/" + file, ["app-support/" + file]);
		}

		const extensionsFiles = fs.readdirSync("extensions");
		for (const file of extensionsFiles) {
			await minifyFile("../dist/extensions/" + file, ["extensions/" + file]);
		}

		const i18nFiles = fs.readdirSync("i18n");
		for (const file of i18nFiles) {
			await minifyFile("../dist/i18n/" + file, ["i18n/" + file]);
		}

		console.log("\x1B[33m%s\x1B[0m", "處理完成");
	} catch (error) {
		console.error("\x1B[31m%s\x1B[0m", "處理過程中發生錯誤:", error);
		throw error;
	}
};


async function minifyFile(output, srcs) {
	console.log("正在生成" + output);
	var codes = [];
	for (var i = 0; i < srcs.length; i++) {
		codes.push(fs.readFileSync(srcs[i], "utf-8"));
	};
	var code = codes.join("\n").replace(
		/\/\*=:=\*\/([\S\s]+?)\/\*<@([\S\s]+?)@>\*\//g
		, function (a, b, c) {
			console.log("*******使用編譯指令：\n" + a + "\n\n");
			return c;
		});

	// 使用 Terser 進行壓縮
	var res = await minify(code, {
		compress: {
			drop_console: false,  // 保留 console 語句
			drop_debugger: true,  // 移除 debugger 語句
			pure_funcs: [],       // 不移除任何函數調用
		},
		mangle: true,           // 啟用變數名混淆
		format: {
			comments: false,    // 移除註釋
		},
	});

	if (res.error) {
		throw new Error(res.error);
	};

	code =
		`/*
錄音
https://github.com/xiangyuecn/Recorder
src: ${srcs.join(",")}
*/
`;
	code += res.code;
	fs.writeFileSync(output, code);

	//asm.js程式碼檢測，壓縮可能丟掉參數類型：function xx(a,b){a|0;b|0;
	if (/['"]use\s+asm['"]/.test(code)) {
		var exp = /function\s+(\w+)\s*\([^\)]+\)\s*([\{;]\w\|0\b)+[^\}]*\}/g, m;
		while (m = exp.exec(code)) {
			console.log("\x1B[31m%s\x1B[0m", "        asm程式碼壓縮後參數錯誤：" + m[0] + " 可能是沒有任何引用導致的，嘗試源碼中刪除這個函數");
		}
	}
};






function deleteFolder(path, deep) {
	if (fs.existsSync(path)) {
		var files = fs.readdirSync(path);
		files.forEach(function (file) {
			var p = path + "/" + file;
			if (fs.statSync(p).isDirectory()) {
				deleteFolder(p, (deep || 0) + 1);
			} else {
				fs.unlinkSync(p);
			}
		});
		if (deep) {
			fs.rmdirSync(path);
		};
	};
};





function MDAbsImg(txt, baseUrl) {//簡單的圖片地址 相對路徑改成絕對路徑
	return txt.replace(/\!\[\]\((.+?)\)/g, function (a, url) {
		var folder = baseUrl;
		if (!/^https?:/i.test(url)) {
			while (/^\.\.\/(.*)$/.test(url)) {
				url = RegExp.$1;
				folder = folder.replace(/\/[^\/]+\/$/, "/");
			}
			url = folder + url;
		}
		return '![](' + url + ')';
	});
};

function Run_npm() {
	console.log("\x1B[33m%s\x1B[0m", "製作作者需要上傳的npm包文件...");
	var npmHome = "../assets/npm-home";
	var npmFiles = npmHome + "/npm-files";
	var npmSrc = npmFiles + "/src";
	deleteFolder(npmFiles);
	!fs.existsSync(npmFiles) && fs.mkdirSync(npmFiles);
	fs.mkdirSync(npmSrc);
	var srcDirs = ["engine", "extensions", "i18n", "app-support"];

	var rootREADME = fs.readFileSync("../README.md", "utf-8");
	var appREADME = fs.readFileSync("../app-support-sample/README.md", "utf-8");
	var npmREADME = fs.readFileSync(npmHome + "/README.md", "utf-8");
	rootREADME = MDAbsImg(rootREADME, "https://xiangyuecn.gitee.io/recorder/");
	appREADME = MDAbsImg(appREADME, "https://xiangyuecn.gitee.io/recorder/app-support-sample/");
	npmREADME = MDAbsImg(npmREADME, "https://xiangyuecn.gitee.io/recorder/");

	var npmPackage = fs.readFileSync(npmHome + "/package.json", "utf-8");
	var hashHistory = fs.readFileSync(npmHome + "/hash-history.txt", "utf-8");
	var versionPatch = fs.existsSync(npmHome + "/version.patch.txt") && fs.readFileSync(npmHome + "/version.patch.txt", "utf-8") || "";

	var sha1Obj = crypto.createHash('sha1');
	var writeHashFile = function (path, data) {
		fs.writeFileSync(path, data);
		sha1Obj.update(data);
	};

	var refsData = { "README.Raw": rootREADME, "編輯提醒": "[​](?本文件為動態生成文件，請勿直接編輯，需要編輯請修改npm-home中的README)" };
	var exp = /\(\?Ref=(.+?)&Start\)([\S\s]+?)\[.*?\]\(\?RefEnd/g, m;
	while (m = exp.exec(rootREADME)) {
		refsData["README." + m[1]] = m[2].trim();
	};
	exp.lastIndex = 0;
	while (m = exp.exec(appREADME)) {
		refsData["RecordApp.README." + m[1]] = m[2].trim();
	};
	console.log("Ref已定義項", Object.keys(refsData));

	var exp = /@@Ref (.+?)@@/g;
	npmREADME = npmREADME.replace(exp, function (s, a) {
		var v = refsData[a];
		if (!v) {
			throw new Error("npm README中" + s + "不存在");
		};
		return v;
	});
	npmREADME = npmREADME.replace(/@@Remove Start@@[\S\s]+@@Remove End@@/g, "");
	writeHashFile(npmFiles + "/README.md", npmREADME);
	console.log("已生成" + npmFiles + "/README.md");

	var npmVer = 0;
	var npmPatch = 0;
	npmPackage = npmPackage.replace(/"([\d\.]+)123456.9999"/g, function (s, a) {
		var d = new Date();
		var v = ("" + d.getFullYear()).substr(-2);
		v += ("0" + (d.getMonth() + 1)).substr(-2);
		v += ("0" + d.getDate()).substr(-2);

		var patch = "00";
		if (versionPatch) {
			var obj = JSON.parse(versionPatch);
			var day = obj.date.replace(/-/g, "");
			if (day.length != 8) {
				throw new Error("versionPatch.date無效");
			};
			if (day.substr(-6) == v) {
				patch = ("0" + obj.patch).substr(-2);
			};
		};

		v = '"' + a + v + patch + '"';
		npmVer = v;
		npmPatch = patch;
		return npmVer;
	});
	console.log("\x1B[32m%s\x1B[0m", "package version:" + npmVer + " patch:" + npmPatch + '，如果需要修改patch，請新建version.patch.txt，格式{"date":"2010-01-01","patch":12}patch取值0-99當日有效');
	fs.writeFileSync(npmFiles + "/package.json", npmPackage);
	console.log("已生成" + npmFiles + "/package.json");

	var copyFile = function (src, dist) {
		var byts = fs.readFileSync(src);
		writeHashFile(dist, byts);
		console.log("已復制" + dist);
	};
	copyFile("../recorder.mp3.min.js", npmFiles + "/recorder.mp3.min.js");
	copyFile("../recorder.wav.min.js", npmFiles + "/recorder.wav.min.js");
	copyFile("recorder-core.js", npmSrc + "/recorder-core.js");
	srcDirs.forEach(function (dir) {
		var files = fs.readdirSync(dir);
		fs.mkdirSync(npmSrc + "/" + dir);
		files.forEach(function (file) {
			copyFile(dir + "/" + file, npmSrc + "/" + dir + "/" + file);
		});
	});


	var writeDTS = function (path, val) {
		fs.writeFileSync(npmFiles + path, val);
		console.log("已生成" + npmFiles + path);
	};
	var recDTS = 'declare let Recorder : any;\nexport default Recorder;';
	writeDTS("/index.d.ts", recDTS);
	writeDTS("/recorder.mp3.min.d.ts", recDTS);
	writeDTS("/recorder.wav.min.d.ts", recDTS);
	writeDTS("/src/app-support/app.d.ts", 'declare let RecordApp : any;\nexport default RecordApp;');


	//記錄程式碼是否有變更
	var sha1 = sha1Obj.digest("hex");
	var hashArr = JSON.parse(hashHistory || "[]");
	var hasChange = 0;
	if (!hashArr[0] || hashArr[0].sha1 != sha1) {
		hasChange = 1;
		hashArr.splice(0, 0, { sha1: sha1, time: new Date().toLocaleString() });
		hashArr.length = Math.min(hashArr.length, 5);
		fs.writeFileSync(npmHome + "/hash-history.txt", JSON.stringify(hashArr, null, "\t"));
	};

	var msg = "請記得到" + npmFiles + "目錄中上傳npm包" + (hasChange ? "，已發生變更" : "");
	console.log("\x1B[" + (hasChange ? 31 : 32) + "m%s\x1B[0m", msg);

	console.log("\x1B[33m%s\x1B[0m", "處理完成");
};