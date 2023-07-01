/**
 * CLI logic
 *
 *  -  created at 24_jun_2023
 * @author Isaac katongole
 */

// deps
const { EventEmitter } = require("node:events");
const readline = require("node:readline");
const os = require("node:os");
const v8 = require("node:v8");

class MyEmitter extends EventEmitter {}

const e = new MyEmitter();

const cli = {};

// Input handlers
e.on("clear", (str) => {
  cli.responders.clear();
});

e.on("exit", (str) => {
  cli.responders.exit();
});

e.on("man", (str) => {
  cli.responders.help();
});

e.on("help", (str) => {
  cli.responders.help();
});

e.on("stats", (str) => {
  cli.responders.stats();
});

e.on("list logs", (str) => {
  cli.responders.listLogs();
});

e.on("list users", (str) => {
  cli.responders.listUsers();
});

e.on("list checks", (str) => {
  cli.responders.listChecks(str);
});

e.on("more user info", (str) => {
  cli.responders.moreUserInfo(str);
});

e.on("more log info", (str) => {
  cli.responders.moreLogInfo(str);
});

e.on("more check info", (str) => {
  cli.responders.moreCheckInfo(str);
});

// cli responders
cli.responders = {};

cli.responders.clear = () => {
  console.clear();
};

cli.responders.help = () => {
  const commands = {
    clear: "Clears the console",
    exit: "Exit the process with code (0)",
    man: "Show manual pages",
    help: "alias for man",
    stats: "Shows Operating Systems statistics and resource utilization",
    "list users": "List users registered on the server sys.",
    "more user info --{userId}": "Shows detailed of a specified user ",
    "list checks --[up|down]":
      "Shows a list of active users including their state --up|down are optional",
    "more check info --{checkId}": "Shows details of a specified check",
    "list logs": "list log files both compressed and uncompressed.",
    "more log info --{filename}": "Show details of a specified log",
  };

  // page
  cli.displayConsolePage(commands, "CLI MANUAL");
};

//
/**
 *  cli display console page
 * @param {object} obj object to iterate
 * @param {string} headerTitle title for the page
 */
cli.displayConsolePage = (obj, headerTitle) => {
  // display formattings
  cli.horizontalLine();
  cli.center(headerTitle);
  cli.horizontalLine();
  cli.verticalSpace(2);

  // page
  for (let key in obj) {
    let line = ` \x1b[1;34m ${key}\x1b[0m `;
    let leftPadding = 30 - line.length;

    // Add some space after the command
    for (let i = 0; i < leftPadding; i++) {
      line += " ";
    }

    line += obj[key];

    console.log(line);

    cli.verticalSpace(1);
  }

  cli.horizontalLine();
};

cli.responders.stats = () => {
  const {
    total_heap_size,
    peak_malloced_memory,
    malloced_memory,
    used_heap_size,
    heap_size_limit
  } = v8.getHeapStatistics();
  const stats = {
    Uptime: cli.uptime(),
    "Load Average": os.loadavg().join(" "),
    "CPU Count": os.cpus().length,
    "Free Memory": `${os.freemem()} bytes`,
    "Current Malloced Memory": malloced_memory,
    "Peak Malloced Memory": peak_malloced_memory,
    "Allocated Head Used (%)": Math.round(
      (used_heap_size / total_heap_size) * 100
    ),
    "Available Heap Allocated (%)": Math.round(
      (total_heap_size / heap_size_limit) * 100
    ),
  };

  cli.displayConsolePage(stats, "SYSTEM STATISITICS");
};

cli.responders.exit = () => {
  process.exit(0);
};

cli.responders.listLogs = () => {
  console.log("list logs");
};


cli.responders.listUsers = () => {
  console.log("list users");
};

cli.responders.listChecks = () => {
  console.log("list checks");
};

cli.responders.moreCheckInfo = (str) => {
  console.log("More check info %s", str);
};

cli.responders.moreUserInfo = (str) => {
  console.log("More user info %s", str);
};

cli.responders.moreLogInfo = (str) => {
  console.log("More log info %s", str);
};

// horizontalLine
cli.horizontalLine = () => {
  const terminalWidth = process.stdout.columns;
  let line = "";
  for (let i = 0; i < terminalWidth; i++) {
    line += "-";
  }
  console.log(line);
};

// verticalSpace
cli.verticalSpace = (space) => {
  space = typeof space === "number" && space > 0 ? space : 1;

  for (let i = 0; i < space; i++) {
    console.log(" ");
  }
};

// center
cli.center = (str) => {
  str = cli.validate(str);

  if (!str) return;

  // get the terminal width
  const terminalWidth = process.stdout.columns;

  // calculate the leftpadding i.e (totalwidth - str.length ) /2
  const leftPadding = Math.floor((terminalWidth - str.length) / 2);

  let line = "";

  for (let i = 0; i < leftPadding; i++) {
    line += " ";
  }

  line += str;

  console.log(line);
};

cli.uptime = () => {
  const hours = Math.floor(os.uptime() / (60 * 60));
  const mins = Math.floor((os.uptime() % (60 * 60)) / 60);

  return `${hours}:${mins}`;
};

cli.validate = (str) =>
  typeof str === "string" && str.trim().length > 0 ? str.trim() : "";

// used to process the user inputs from the console
cli.processInput = (str) => {
  str = typeof str === "string" && str.trim().length > 0 ? str.trim() : false;

  // if the line string is empty
  // do nothing
  if (!str) return;

  const commands = [
    "clear",
    "exit",
    "man",
    "help",
    "stats",
    "list logs",
    "list users",
    "list checks",
    "more user info",
    "more check info",
    "more log info",
  ];

  let matchFound = false;

  commands.some((command) => {
    if (!(str.toLowerCase().indexOf(command) > -1)) return;

    // here the str matches some command
    matchFound = true;
    e.emit(command, str);
    return true;
  });

  if (!matchFound) return console.log(`${str}: Command not found `);
};

cli.init = function () {
  const _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "\x1b[1;32m~$\x1b[0m ",
  });

  // Prompt to the user
  _interface.prompt();

  // listen for data on `line` event
  _interface.on("line", (line) => {
    cli.processInput(line);

    // re-prompt to the user
    _interface.prompt();
  });

  // on close
  _interface.on("close", () => {
    console.log(`Take care bye`);
    process.exit(0);
  });
};

module.exports = cli;
