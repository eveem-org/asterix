/*

    Helper functions for the management of Eveem traces.

*/


Array.prototype.extend = function (other_array) {
    /* You should include a test to check whether other_array really is an array */
    other_array.forEach(function(v) {this.push(v)}, this)
}

function opcode(exp) {
    if (typeof exp == "object") {
        return exp[0]
    } else {
        return null
    }
}

function is_zero(exp) {
    if (opcode(exp) == 'LE') {
        return ['GT', exp[1], exp[2]]
    }

    if (opcode(exp) == 'LT') {
        return ['GE', exp[1], exp[2]]
    }

    if (opcode(exp) == 'GE') {
        return ['LT', exp[1], exp[2]]
    }

    if (opcode(exp) == 'GT') {
        return ['LE', exp[1], exp[2]]
    }

    return ['ISZERO', exp]
}

/*

    Analyser

*/

function walk_trace(trace, f, knows_true) {
    res = [];

    var line_number = 0;

    for (var line of trace) {
        line_number += 1;

        res.extend(f(line, knows_true, trace.slice(line_number)))
        
        if (opcode(line) == 'IF') {

            condition = line[1]
            if_true = line[2]
            if_false = line[3]

            prev_true = JSON.stringify(knows_true)
            zzz = JSON.parse(JSON.stringify(knows_true)).concat([condition])
            prev_prev_true = JSON.parse(JSON.stringify(knows_true))

            res = res.concat(walk_trace(if_true, f, zzz));

            knows_true = prev_prev_true
            res = res.concat(walk_trace(if_false, f, knows_true.concat([is_zero(condition)])));

            break
        }
    }
    return res
}

functions = JSON.parse(contract).functions;

// alternatively, uncomment below, and run the script directly
// from terminal, by calling `node showme.js`

/*var fs = require("fs");
functions = JSON.parse(fs.readFileSync("test.json")).functions*/


function find_underflows(line, knows_true, remainder) {

    // find potential underflows

    // (store sth, add sth mul -1 sth_else) -> check if sth_else < 
    if ((opcode(line) == 'STORE') && 
        (opcode(line[5]) == 'ADD') &&
        (opcode(line[5][2]) == 'MUL')  &&
        (line[5][2][1] == -1)) {  

            left = line[5][1];
            right = line[5][2][2];

            s = JSON.stringify(knows_true);

            for (fact of knows_true) {

                if ((opcode(fact[1]) == 'ADD') || (opcode(fact[2]) == 'ADD')) {
                    return []
                } // filters many false positives, but miss a few negatives */

                if ((fact.toString() == ['LE', right, left].toString()) ||
                    (fact.toString() == ['LT', right, left].toString()) || 
                    (fact.toString() == ['GE', left, right].toString()) ||
                    (fact.toString() == ['GT', left, right].toString())) {
                    return []
                }

            }

            return [ line ]

    }

    return []
}

function find_destructs(line, knows_true, remainder) {

    // find potential underflows

    // (store sth, add sth mul -1 sth_else) -> check if sth_else < 
    if ((opcode(line) == 'SELFDESTRUCT') &&
        knows_true.length == 0) {  

            // a simple checker for open selfdestructs

            return [ line ]

    }

    return []
}

/*
    
    Main.

    For every function in the contract, check the trace for destructs.
    If it has any matching the criteria, add it to the output.

*/

output = Array()

for (func of functions) {

    trace = func.trace

    // preview only transfer/transferFrom functions that
    // are short only
    // other ones would require a more detailed analyser

    if (!func.name.includes('transfer(') &&
        !func.name.includes('transferFrom(')) {
            continue
    }

    if (func.print.length > 2000) {
        continue
    }

    // proper code

    res = walk_trace(trace, find_underflows, []) // replace with find_destructs for finding open selfdestructs

    if (res.length > 0) {
        output.push(JSON.stringify({
            'func_name': func.name,
            'print': func.print,
            'offenders': res
        }))
    }

}


return output

/*

    The returned output is used in the resulting SELECT in asterix.py

*/