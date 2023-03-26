const { Configuration, OpenAIApi } = require("openai");
const readline = require('readline');
const crypto = require('crypto');
const { getJson, setJson, sleep, getParameterCaseInsensitive } = require("./helpers");
const getQuizWithExplanation = require("./getQuizWithExplanation");
const showLoadingBar = require("./nodeLoadingBar");
const dotenv = require('dotenv');

dotenv.config();
Array.prototype.random = function (justInt) {
  if (justInt) return crypto.webcrypto.getRandomValues(new Uint32Array(1))[0] % this.length;
  return this[crypto.webcrypto.getRandomValues(new Uint32Array(1))[0] % this.length];
}
Array.prototype.scrambled = function () {
  let temp = [...this], arr = []
  while (temp.length > 0) arr.push(temp.splice(temp.random(true), 1)[0]);
  return arr
}

function setStore(data) {
  setJson("./store.json", data);
}
function getStore() {
  const defaultStore = {
    version: 0.03,
    allEntries: {}, //each key is a course/book name
    excerptCache: {}, // each key is an excerpt title
  }
  const store = getJson("./store.json");

  if (store.version === defaultStore.version) {
    return store;
  } else {
    setStore(defaultStore);
    return defaultStore;
  }
}
//useless caching but just to say that it will be cached somewhere
const cacheStore = getStore();

const colours = {
  lightgreen: '\x1b[1m\x1b[32m',
  lightblue: '\x1b[1m\x1b[34m',
  lightcyan: '\x1b[1m\x1b[36m',
  lightyellow: '\x1b[1m\x1b[33m',
  lightmagenta: '\x1b[1m\x1b[35m',
  lightwhite: '\x1b[1m\x1b[37m',
  lightred: '\x1b[1m\x1b[31m'
}
const correctColour = colours.lightgreen
const wrongColour = colours.lightred
const userColour = colours.lightwhite
const messageColour = colours.lightcyan
const systemMessageColour = colours.lightyellow
const systemErrorColour = colours.lightred
const answerColour = colours.lightmagenta
const resetColours = '\x1b[0m'

function quitProcess() {
  process.exit(0);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  historySize: 50,
  tabSize: 2,
  prompt: ''
})
rl.on('SIGCONT', _ => rl.prompt()); //prompt will automatically resume the stream
rl.on('close', _ => quitProcess()); //ctrl+c exits rl, exit proess too
async function getUserInput(prompt) {
  let resolve = null, prom = new Promise(work => resolve = work);
  rl.question(systemMessageColour + prompt + "\n> " + resetColours, resolve);
  const userInput = await prom;
  if (userInput.toLowerCase() === "exit") {
    console.log(systemMessageColour + "Goodbye." + resetColours);
    quitProcess();
  }
  return userInput;
}


const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
async function createCompletion(prompt) {
  return await openai.createCompletion({
    model: "text-davinci-003", max_tokens: 2048, temperature: 0.7, prompt
  })
}
function parse(text) {
  var TEXT = text.split('\n'), arr = [[]], i = 0;
  TEXT.forEach((line, n) => {
    if (line.length < 1) return null; //ignore empty lines

    let theEnd = line.toLowerCase().startsWith('answer')
    if (!theEnd)
      line = line.substr(1 + line.indexOf(' '));

    arr[i].push(line)
    if (theEnd && n + 1 < TEXT.length) arr[++i] = [];
  })
  return arr
}
const openai = new OpenAIApi(configuration);

const makeQuiz = {
  fromChatCompletion: async function (title, excerpt) {
    const cache = getParameterCaseInsensitive(cacheStore.excerptCache, title);
    if (cache) return cache;

    let currTime = Date.now();

    const seconds = 20;
    showLoadingBar(0, 1, `Creating quiz...(this may take about ${seconds} seconds)`);

    const limit = seconds * 1e3;
    let s = setInterval(_ => {
      let diff = Date.now() - currTime;
      const diffT = Math.round(diff / 1e3);
      if (diff >= limit) return clearInterval(s);
      showLoadingBar(diff, limit, `Creating quiz...(this may take about ${seconds} seconds:[${diffT}/${seconds}])`)
    }, 200);

    cacheStore.excerptCache[title] = await getQuizWithExplanation(openai, title, excerpt);
    clearInterval(s);
    showLoadingBar(1, 1, "Quiz created!");

    setTimeout(_ =>
      console.log({ time_taken: (Date.now() - currTime) / 1e3 }, '\n\n\n')
      , 1e3)
    return cacheStore.excerptCache[title]
  },
  fromCompletion: async function (userInput, refresh = 1) {
    const bookOrCourseTitle = userInput;
    // if cache exists, return it
    const cache = getParameterCaseInsensitive(cacheStore.allEntries, bookOrCourseTitle);
    if (cache) return cache;

    //else begin caching below
    let currTime = Date.now()
    cacheStore.allEntries[bookOrCourseTitle] = {} //each key is a unique topic

    const numQuestions = 3;
    let loadingBarCurr = 0;
    for (let i = 0; i < refresh; i++) { //fill topics
      showLoadingBar(loadingBarCurr, 1, "Creating quiz...");
      const result = await createCompletion(`What are the topics offered by the book:\n"${bookOrCourseTitle}"\n`)

      const { text } = result.data.choices[0];
      var list = text.split('\n')
        .filter(a => !isNaN(a[0]))
        .map(a => a.substring(1 + a.indexOf(' ')));

      const loadingBarMax = list.length * refresh * refresh;
      for (const topic of list) {
        for (let i = 0; i < refresh; i++) {
          loadingBarCurr++;
          showLoadingBar(loadingBarCurr, loadingBarMax, "Creating quiz...");
          if (cacheStore.allEntries[bookOrCourseTitle][topic]) continue; //don't repeat for requests

          cacheStore.allEntries[bookOrCourseTitle][topic] = {}; //each key is a unique question

          parse((await createCompletion(
            `using the following format below, write ${numQuestions} multiple choice questions(with the answers) on the topic: "${topic}"\n- The Question\nA) option\nB) option\nC) option\nD) option\nE) option\n- The Answer\n\n`
          )).data.choices[0].text)
            .forEach(question => {
              let [Q, a, b, c, d, e, A] = question;
              if (cacheStore.allEntries[bookOrCourseTitle][topic][Q]) return null; //don't repeat for same questions

              let theSwitch = { A: 0, B: 1, C: 2, D: 3, E: 4 } //for conversion of answer to indexOf correct answer

              const answerID = theSwitch[A[8]]; //A[8] is the answer's letter
              cacheStore.allEntries[bookOrCourseTitle][topic][Q] = {
                question: Q,
                options: [
                  [a],
                  [b],
                  [c],
                  [d],
                  [e]
                ],
                answer: answerID,
                correct: 0, incorrect: 0 //accuracy for a subtopic because yes
              }
              cacheStore.allEntries[bookOrCourseTitle][topic][Q].options[answerID].push("<answer>"); // let specific response know its own answer so when scrambled we will still know
            })
        }
      }


    }
    showLoadingBar(loadingBarCurr, loadingBarCurr, "Quiz created!");

    setTimeout(_ =>
      console.log({ time_taken: (Date.now() - currTime) / 1e3 }, '\n\n\n')
      , 1e3)
    return cacheStore.allEntries[bookOrCourseTitle]
  }
};


//execution

async function generateQuizFromExisting(attempts) {
  let beginningPrompt = "Enter the name of a book OR a course title, or 'exit' to quit.";
  if (attempts === 0)
    beginningPrompt += "\nE.G:Discrete Mathematics with Applications;Computer Science Algorithms;";
  const userInput = await getUserInput(beginningPrompt) //"Discrete Mathematics with Applications"

  const content = await makeQuiz.fromCompletion(userInput)

  setStore(cacheStore);
  await sleep(500);
  try {
    const topic = Object.values(content).random()
    //console.log(topic,'1234',Object.values(topic),1232131223) //adf
    const questions = Object.values(topic).scrambled()
    //console.log(questions,54)
    for (const question of questions) {
      //console.log(questions,question) //adf
      const options = question.options.scrambled()
      const mapping = ["A", "B", "C", "D", "E"]
      const correctAnswerIndex = options.findIndex(elem => elem.length === 2)
      const correctAnswerLetter = mapping[correctAnswerIndex];
      const correctAnswer = question.options[question.answer][0];
      const correctAnswerString = correctAnswerLetter + ") " + correctAnswer;
      const choices = options.map((a, i) => mapping[i] + ") " + a[0]).join('\n')
      const thePrompt = `${question.question}\n\n${messageColour + choices + resetColours}\n`

      const result = await getUserInput(thePrompt);

      const isCorrect = (result.toLowerCase() === correctAnswer.toLowerCase()) || (result.toLowerCase() === correctAnswerLetter.toLowerCase()) || (result.toLowerCase() === correctAnswerString.toLowerCase())

      if (isCorrect) question.correct++;
      else question.incorrect++;

      const responseColour = isCorrect ? correctColour : wrongColour;
      if (isCorrect) {
        console.log(responseColour + "Correct!" + resetColours);
      } else {
        console.log(responseColour + "Incorrect!" + resetColours);
      }
      console.log(answerColour + "Answer:\t" + resetColours + responseColour + correctAnswerString + resetColours + "\n\n")

      setStore(cacheStore);
    }
  } catch (e) {
    console.error("Can't generate from existing", e);
    throw `Could not create a quiz on "${userInput}". `;
  }
}

async function generateQuizFromParagraph() {
  const title = await getUserInput("Enter title for this topic paragraph or excerpt, or 'exit' to quit.");

  const cache = getParameterCaseInsensitive(cacheStore.excerptCache, title);
  if (cache) return cache;

  const excerpt = await getUserInput("Enter topic paragraph or excerpt, or 'exit' to quit.") //"Discrete Mathematics with Applications"

  const content = await makeQuiz.fromChatCompletion(title, excerpt);

  setStore(cacheStore);


  await sleep(500);
  try {
    const topic = content;
    //console.log(topic,'1234',Object.values(topic),1232131223) //adf
    const questions = Object.values(topic.questions);
    //console.log(questions,54)
    for (const question of questions) {
      //console.log(questions,question) //adf
      const options = question.options.scrambled()
      const mapping = ["A", "B", "C", "D", "E"]
      const correctAnswerIndex = options.findIndex(elem => elem.length === 2)
      const correctAnswerLetter = mapping[correctAnswerIndex];
      const correctAnswer = question.options[question.answer][0];
      const correctAnswerString = correctAnswerLetter + ") " + correctAnswer;
      const explanation = question.explanation || "";
      const choices = options.map((a, i) => mapping[i] + ") " + a[0]).join('\n')
      const thePrompt = `${question.question}\n\n${messageColour + choices + resetColours}\n`

      const result = await getUserInput(thePrompt);

      const isCorrect = (result.toLowerCase() === correctAnswer.toLowerCase()) || (result.toLowerCase() === correctAnswerLetter.toLowerCase()) || (result.toLowerCase() === correctAnswerString.toLowerCase())

      if (isCorrect) question.correct++;
      else question.incorrect++;

      const responseColour = isCorrect ? correctColour : wrongColour;
      if (isCorrect) {
        console.log(responseColour + "Correct!" + resetColours);
      } else {
        console.log(responseColour + "Incorrect!" + resetColours);
      }
      console.log(answerColour + "Answer:\t" + resetColours + responseColour + correctAnswerString + resetColours);
      if (!isCorrect && explanation !== "") {
        console.log(answerColour + "Explanation:\t" + resetColours + messageColour + explanation + resetColours);
      }
      console.log("\n\n");

      setStore(cacheStore);
    }
  } catch (e) {
    console.error("Can't generate from excerpt", e);
    throw `Could not generate a quiz from that excerpt`;
  }

}

(async () => {
  let attempts = 0;
  let errorMsg = "";
  while (true) {
    if (errorMsg)
      console.log(systemErrorColour + errorMsg + resetColours);
    errorMsg = "";

    const optionsText = "What do you want to do? (enter option letters):\nA) Create quiz from existing book or course\nB) Create quiz from large text paragraph or excerpt";
    const input = await getUserInput(optionsText);
    if (input.length > 0) {
      const choice = input[0].toLowerCase();
      if (choice === "a") {
        try {
          await generateQuizFromExisting(attempts);
        } catch (e) {
          errorMsg = e;
        }
      } else if (choice === "b") {
        try {
          await generateQuizFromParagraph(attempts);
        } catch (e) {
          errorMsg = e;
        }
      } else {
        errorMsg = "This choice is not available.";
      }
    }

    attempts++;
  }
})()