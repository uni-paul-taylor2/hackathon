async function showLoadingBar(currentProgress, totalProgress, word = "complete") {
  let text = `[${(2 ** 20).toString(2).split('').map((_, i) => i / 20 <= currentProgress / totalProgress ? "|" : " ").join('')
    }] - ${(100 * currentProgress / totalProgress).toFixed(2)}% ${word}`
  await new Promise(next => process.stdout.clearLine(0, next))
  await new Promise(next => process.stdout.cursorTo(0, next))
  process.stdout.write(text)
}


module.exports = showLoadingBar;