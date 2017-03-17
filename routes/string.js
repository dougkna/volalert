
var hello = 'hahap';
var hel = 'hap';
check(hel, hello, 0);

function check(sub, whole, num){
	if (num === sub.length) {
		console.log("FOUND.");
		return true;
	}

	if (sub.length === 0) {
		console.log("COULD NOT FIND.");
		return false;
	}

	if (whole.charAt(0) === sub.charAt(num)){
		num += 1;
	} else {
		num = 0;
	}
	whole = whole.slice(1);
	check(sub, whole, num);
}

function LinkedList() {
	this.head = null;
}

LinkedList.prototype.push = function(val) {
	
}