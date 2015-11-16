
function ProblemDefinition(size, speeds, omega, edges, edges_value) {
    this.size = size;
    if(speeds) {
        this.speeds = speeds;
    } else this.speeds = 1 + 2 * size.length;
    if(omega) {
        this.omega = omega;
    } else this.omega = 1;

    if(edges !== undefined) {
        this.edges = edges;
        if(edges_value) {
            this.edges_value = edges_value;
        } else {
            this.edges_value = Array.apply(null, 
                    new Array(this.speeds)).map(function(){return 0;});
        }
    } else {
        this.edges = ProblemDefinition.EDGE_TYPE.WRAP;
    }

}

ProblemDefinition.EDGE_TYPE = Object.freeze({
    WRAP: 0,
    ZERO: 1,
    VALUE: 2,
});

ProblemDefinition.prototype.get_cell_count = function() {
    return this.size.reduce(function(a,b) {return a * b}, 1);
}

ProblemDefinition.prototype.get_cell_id = function() {
    if(arguments.length != this.size.length) throw "Invalid dimensions";
    var id = 0;
    for(var i = 0; i < arguments.length; i++) {
        id *= this.size[i];
        if(arguments[i] >= this.size[i] || arguments[i] < 0) {
            switch(this.edges) {
                case ProblemDefinition.EDGE_TYPE.WRAP:
                    id += ((arguments[i] % this.size[i]) + this.size[i]) % 
                            this.size[i];
                    break;
                case ProblemDefinition.EDGE_TYPE.ZERO:
                case ProblemDefinition.EDGE_TYPE.VALUE:
                    return -1;
            }
        } else {
            id += arguments[i];
        }
    }
    return id;
}

/*
 * Place holder function, to be overridden with a function that correctly 
 * determines the nature of the cell.
 */
ProblemDefinition.prototype.is_obstacle = function() {
    return false;
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
    var id = this.problem.get_cell_id.apply(this.problem, arguments);
    if(id == -1) return this.problem.edges_value.slice();
    return this.storage[id];
}

StepStorage.prototype.clone = function() {
    var new_step = new StepStorage(this.problem);
    for(var i = 0; i < this.problem.get_cell_count(); i++) {
        new_step.storage[i] = this.storage[i].slice();
    }
    return new_step;
}

StepStorage.prototype.add = function(other) {
    if(other.problem != this.problem) throw "Can only add for same problem.";
    this.storage.map(function(value, index) {
        return value + other.storage[index];
    });
}