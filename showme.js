/*

    Script for finding self-destructs in a contract.

*/

functions = JSON.parse(contract).functions;

// alternatively, uncomment below, and run the script directly
// from terminal, by calling `node showme.js`

//var fs = require("fs");
//functions = JSON.parse(fs.readFileSync("kitties.json")).functions

/*

    For more information about the Eveem.org API, and the trace format,
    check out showme example here:
    https://github.com/kolinko/showmewhatyougot

    The stuff below is a port of fragments of the `showme` demo.

*/

/*

	helper functions	

*/

Array.prototype.extend = function (other_array) {
    /* You should include a test to check whether other_array really is an array */
    other_array.forEach(function(v) {this.push(v)}, this);
}

function opcode(exp) {
	if (typeof exp == "object") {
		return exp[0]
	} else {
		return null
	}
}

function is_zero(exp) {
	return ['ISZERO', exp]
}

function simplify(exp) {
	if ((opcode(exp) == 'ISZERO') && (opcode(exp[1]) == 'ISZERO')) {
		return simplify(exp[1][1])
	} else {

		if ((typeof x == 'object') || (typeof x == 'array')) {
			res = Array()
			for (x of exp) {
				res.push(simplify(x))
			}
			return res
		
		} else {
			return exp
		
		}
	}
}

//console.log(simplify(['IS_ZERO', ['IS_ZERO', 'abc']]))

function walk_trace(trace, f, knows_true=null) {
	res = Array()
	knows_true = knows_true?knows_true:Array()

	for (line of trace) {
		res.extend(f(line, knows_true))//.extend(res)
		
		if (opcode(line) == 'IF') {

            condition = line[1]
            if_true = line[2]
            if_false = line[3]

            res = res.concat(walk_trace(if_true, f, knows_true.concat([condition])))
            res = res.concat(walk_trace(if_false, f, knows_true.concat([is_zero(condition)])))

            break
		}
	}
	return res
}

/*
	the code
*/

function get_caller_cond(condition) {
	/*
    #  checks if the condition has this format:
    #  (EQ (MASK_SHL, 160, 0, 0, 'CALLER'), something)

    #  if it does, returns the storage data
    #

    #  it doesn't catch conditions like `require stor0[caller].0.uint8`
    #  as in, for example 0x0370840bCdF2Cb450A18f8eD89982593503f4856
    */

    condition = simplify(condition)

    if (opcode(condition) != 'EQ') {
        return null
    }

    if (condition[1].toString() == ['MASK_SHL', 160, 0, 0, 'CALLER'].toString()) {
        stor = condition[2]
    }
    else if (condition[2].toString() == ['MASK_SHL', 160, 0, 0, 'CALLER'].toString()){
        stor = condition[1]
    }
    else if (condition[1].toString() == 'CALLER'){
        stor = condition[2]
    }
    else if (condition[2].toString() == 'CALLER'){
        stor = condition[1]
    }
    else {
        return null
    }

    if (opcode(stor) == 'MASK_SHL') {
    	stor = stor[4]
    }

    if (opcode(stor) == 'STORAGE' && stor.length == 4)
        return stor
    else if (typeof stor == 'number')
        return '0x' + stor.toString(16)
    else
        return 'unknown'
}

function find_destructs(line, knows_true) {
    if (opcode(line) != 'SELFDESTRUCT') //'SELFDESTRUCT':
        return Array()

    callers = Array()
    for (cond of knows_true) {
    	cond = simplify(cond)
        caller = get_caller_cond(cond)

        if (caller) {
            callers.push(caller)
        }
    }

    if (callers.length == 0) 
    	return [ knows_true ]
   	else
   		return Array() 
}



function test(exp, knows_true) {
    return [ [opcode(exp), knows_true] ]
}


output = Array()

for (func of functions) {
	trace = func.trace
	res = walk_trace(trace, find_destructs)
	if (res.length > 0) {
		console.log(func.color_name)
		console.log(res)
		output.push(JSON.stringify({
			'func_name': func.name,
			'print': func.print,
			'res': res
		}))
	}
}

return output
