const { Configuration, OpenAIApi } = require("openai"), readline=require('readline'), crypto=require('crypto');
Array.prototype.random=function(justInt){
  if(justInt) return crypto.webcrypto.getRandomValues(new Uint32Array(1))[0] % this.length;
  return this[crypto.webcrypto.getRandomValues(new Uint32Array(1))[0] % this.length];
}
Array.prototype.scrambled=function(){
  let temp=[...this], arr=[]
  while(temp.length>0) arr.push( temp.splice(temp.random(true),1) );
  return arr
}

const allEntries={} //each key is a course/book name
//useless caching but just to say that it will be cached somewhere
var colours={
  lightgreen:'\x1b[1m\x1b[32m',
  lightblue:'\x1b[1m\x1b[34m',
  lightcyan:'\x1b[1m\x1b[36m',
  lightyellow:'\x1b[1m\x1b[33m',
  lightmagenta:'\x1b[1m\x1b[35m',
  lightwhite:'\x1b[1m\x1b[37m',
  lightred:'\x1b[1m\x1b[31m'
}
var correctColour=colours.lightgreen
var wrongColour=colours.lightred
var userColour=colours.lightwhite
var messageColour=colours.lightcyan
var systemColour=colours.lightyellow
var answerColour=colours.lightmagenta
var reset='\x1b[0m'



const rl=readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  historySize: 50,
  tabSize: 2,
  prompt: ''
})
rl.on('SIGCONT', _=>rl.prompt()); //prompt will automatically resume the stream
rl.on('close', _=>process.exit(0)); //ctrl+c exits rl, exit proess too
async function QUESTION(prompt){
  let resolve=null, prom=new Promise(work=> resolve=work );
  rl.question(systemColour+prompt+reset,resolve);
  return await prom;
}


const configuration = new Configuration({
  apiKey: "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",
})
async function createCompletion(prompt){
  return await openai.createCompletion({
    model:"text-davinci-003", max_tokens:2048, temperature:0.7, prompt
  })
}
function parse(text){
  var TEXT=text.split('\n'), arr=[[]], i=0;
  TEXT.forEach((line,n)=>{
    if(line.length<1) return null; //ignore empty lines
    
    let theEnd=line.toLowerCase().startsWith('answer')
    if(!theEnd)
      line=line.substr(1+line.indexOf(' '));
    
    arr[i].push(line)
    if(theEnd && n+1<TEXT.length) arr[++i]=[];
  })
  return arr
}
const openai = new OpenAIApi(configuration);


async function makeQuiz(userInput,refresh=1){
  if(allEntries[userInput]) return allEntries[userInput];

  //else begin caching below
  let currTime=Date.now()
  allEntries[userInput]={} //each key is a unique topic
  
  for(let i=0;i<refresh;i++){ //fill topics
    const result=await createCompletion(`What are the topics offered by the book:\n"${userInput}"\n`)
    
    const {text}=result.data.choices[0];
    var list=text.split('\n')
        .filter(a=> !isNaN(a[0]) )
        .map(a=> a.substr(1+a.indexOf(' ')) );
    
    for(choice of list){
      for(let i=0;i<refresh;i++){
        if(allEntries[userInput][choice]) continue; //don't repeat for requests
        
        allEntries[userInput][choice]={}; //each key is a unique question
        
        parse((await createCompletion(
          `using the following format below, write 3 multiple choice questions(with the answers) on the topic: "${choice}"\n- The Question\nA) option\nB) option\nC) option\nD) option\nE) option\n- The Answer\n\n`
        )).data.choices[0].text)
        .forEach(question=>{
          let [Q,a,b,c,d,e,A]=question;
          if(allEntries[userInput][choice][Q]) return null; //don't repeat for same questions
          
          let theSwitch={A:0, B:1, C:2, D:3, E:4} //for conversion of answer to indexOf correct answer
          allEntries[userInput][choice][Q] = {
            question: Q,
            options: [a,b,c,d,e],
            answer: theSwitch[ A[8] ], //A[8] is the answer's letter
            correct:0, incorrect:0 //accuracy for a subtopic because yes
          }
        })
      }
    }
    
  }
  
  setTimeout(_=>
    console.log({ time_taken:(Date.now()-currTime)/1e3 },'\n\n\n')
  ,1e3)
  return allEntries[userInput]
};



//execution
(async()=>{
  while(true){
    let userInput = await QUESTION('Enter the name of a book OR a course title\n') //"Discrete Mathematics with Applications"
    let content = await makeQuiz(userInput)
    console.log(content,'hmm')
    let topic = Object.values(content).random()
    console.log(topic,'1234')
    let questions = Object.values(topic).scrambled()
    console.log(questions,54)
    for(let question of questions){
      console.log(questions,question)
      let options=question.options.scrambled()
      let mapping=['A) ','B) ','C) ','D) ','E) ']
      let choices=options.map((a,i)=>mapping[i]+a).join('\n')
      let thePrompt=`${  question.question  }\n\n${  messageColour+choices+reset  }\n\n`
      
      let correctAnswer=question.options[question.answer]
      let result = await QUESTION(thePrompt)
      let isCorrect=result===correctAnswer
      if(isCorrect) question.correct++;
      else question.incorrect++;
      
      let responseColour = isCorrect? correctColour: wrongColour;
      console.log(answerColour+"Answer:\t"+reset+responseColour+correctAnswer+reset+"\n\n\n")
    }
  }
})()
//makeQuiz(userInput).then(console.log)
