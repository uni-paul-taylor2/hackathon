async function showLoadingBar(currentProgress, totalProgress, word = "complete") {
  let yellow='\x1b[1m\x1b[33m', cyan='\x1b[1m\x1b[36m', magenta='\x1b[1m\x1b[35m', reset='\x1b[0m'
  
  let text = yellow+`[${ cyan+
    (2 ** 20).toString(2).split('').map((_, i) => i / 20 <= currentProgress / totalProgress ? "|" : " ").join('')
  +yellow }]${magenta} - ${(100 * currentProgress / totalProgress).toFixed(2)}% ${word+reset}`;
  
  await new Promise(next => process.stdout.clearLine(0, next))
  await new Promise(next => process.stdout.cursorTo(0, next))
  process.stdout.write(text)
}


module.exports = showLoadingBar;
