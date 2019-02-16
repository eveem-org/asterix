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

//var fs = require("fs");
//functions = JSON.parse(fs.readFileSync("test.json")).functions


function find_features(line, knows_true, remainder) {

    if (opcode(line) == 'DELEGATE') {
        return [['delegate '+line[3].toString()],
                ['delegate '+line[2].toString()]]

    }

    if (opcode(line) == 'PRECOMPILED') {
        return [['precompiled '+line[2].toString()]]
    }

    if (opcode(line) == 'CREATE') {
        return [['create code '+line[2].toString()],
                 ['create funded '+(line[1] == 0?'no':'yes')]]
    }

    if (opcode(line) == 'CALL') {

        gas = line[1]
        addr = line[2]
        wei = line[3].toString()
        fname = line[4]
        params = line[5]


        res = [
            'value ' + wei,
            'gas '+ gas.toString(),
            'addr_from_function_param '+addr.toString().includes('cd'),
            'fname '+ (fname!=null?fname.toString():0),
            'params '+ (params?(params.length -1).toString():0),
//            'line'+JSON.stringify(line),
        ]


        for (var op of ['ADD', 'cd', 'STORAGE', 'CALLER', 'BALANCE', 'ADDRESS', 'BLOCK', 'TIMESTAMP']) {
            res.push('value_has_'+op+' '+(wei.includes(op)?'yes':'no'))
        }

        if (wei.includes('-1') && wei.includes('MUL')) {
            res.push('value_has_SUB yes')
        } else {
            res.push('value_has_MUL yes')
        }

        return res


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

/*    if (!func.name.includes('transfer(') &&
        !func.name.includes('transferFrom(')) {
            continue
    }

    if (func.print.length > 2000) {
        continue
    }*/

    // proper code

    res = walk_trace(trace, find_features, []) // replace with find_destructs for finding open selfdestructs

    if (res.length > 0) {
        console.log(func.name)

        for (col of ['95m', '91m', '38;5', '32m', '93m', '92m', '94m']) {
            res.push('col'+col+' '+(func.print.split(col) || []).length)
        };

        console.log(res)


        output.push(JSON.stringify({
            'func_name': func.name,
            'print': func.print,
            'traits': res
        }))
    }

}


return output

/*

    The returned output is used in the resulting SELECT in asterix.py

*/