
function ProblemDefinition(size, speeds) {
    this.size = size;
    if(speeds) {
        this.speeds = speeds;
    } else this.speeds = 1 + 2 * size.length;
}

ProblemDefinition.prototype.get_cell_count = function() {
    return this.size.reduce(function(a,b) {return a * b}, 1);
}

function StepStorage(problem, initial_value) {
    var initial_array;

    this.problem = problem;
    if(initial_value instanceof Array) {
        if(initial_value.length != problem.speeds) 
            throw "Bad step initial_value, required " + problem.speeds + 
                " values, received " + initial_value.length;
        initial_array = initial_value;
    } else if(typeof initial_value === "number" ||
                initial_value instanceof Number) {
        initial_array = Array.apply(null, 
                new Array(problem.speeds)).map(function() {
            return initial_value;
        });
    } else if(!initial_value) {
        initial_array = Array.apply(null,
                new Array(problem.speeds)).map(function() {
            return 0;
        });
    }
    this.storage = Array.apply(null, 
            new Array(problem.get_cell_count())).map(function() {
        return initial_array.slice(0);
    });
}

StepStorage.prototype.get_cell = function() {
    if(arguments.length != this.problem.size.length) throw "Invalid dimensions";
    var id = 0;
    for(var i = 0; i < arguments.length; i++) {
        id *= this.problem.size[i];
        id += arguments[i];
    }
    return this.storage[id];
}

StepStorage.prototype.clone = function() {
    var new_step = new StepStorage(this.problem);
    for(var i = 0; i < this.problem.get_cell_count(); i++) {
        new_step.storage[i] = this.storage[i].slice();
    }
    return new_step;
}