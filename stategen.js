

module.exports = function() {
  	var c = []
    for (i = 0; i < 6; i++) {
      c.push(String.fromCharCode(Math.floor(Math.random()* 26 + 97)));
	}
  
  return c.join('')
}