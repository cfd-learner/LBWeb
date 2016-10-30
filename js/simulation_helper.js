/* Base JavaScript simulation helper class */
function JSSimHelper(steps, file_data) {
    var data = file_data.split("\n"),
        size = [parseInt(data[0]), parseInt(data[1])],
        density = parseFloat(data[4]),
        w0 = density * 4/9,
        w1 = w0 / 4,
        w2 = w1 / 4,
        obst_count = parseInt(data[8]),
        obstacles = [],
        accel_line = data[7].split(' '),
        accel_type = accel_line[1],
        accel_coord = parseInt(accel_line[2]),
        aw1 = density * parseFloat(data[5]) / 9,
        aw2 = aw1 / 4;
    this.size = size;
    for(var i = 0; i < obst_count; i++) {
        var line = data[9 + i].split(" ");
        obstacles[i] = [
                parseInt(line[0]) * size[0] / 100,
                parseInt(line[1]) * size[1] / 100,
                parseInt(line[2]) * size[0] / 100,
                parseInt(line[3]) * size[1] / 100];
    }
    this.problem = new ProblemDefinition(size, 9, parseFloat(data[6]));
    this.problem.is_obstacle = function() {
        var x = ((arguments[0] % this.size[0]) + this.size[0]) % this.size[0],
            y = ((arguments[1] % this.size[1]) + this.size[1]) % this.size[1];
        for(var i = 0; i < obst_count; i++) {
            if(x >= obstacles[i][0] &&
                    y >= obstacles[i][1] &&
                    x < obstacles[i][2] &&
                    y < obstacles[i][3]) return true;
        }
        return false;
    }
    this.accel = new StepStorage(this.problem);

    if(accel_type == "row") {
        accel_coord = Math.floor(accel_coord * size[1] / 100);
        for(var x = 0; x < size[0]; x++) {
            this.accel.get_cell(x, accel_coord)[1] =  aw1;
            this.accel.get_cell(x, accel_coord)[3] = -aw1;

            this.accel.get_cell(x, accel_coord)[5] =  aw2;
            this.accel.get_cell(x, accel_coord)[6] = -aw2;
            this.accel.get_cell(x, accel_coord)[7] = -aw2;
            this.accel.get_cell(x, accel_coord)[8] =  aw2;
        }
    } else {
        accel_coord = Math.floor(accel_coord * size[0] / 100);
        for(var y = 0; y < size[0]; y++) {
            this.accel.get_cell(accel_coord, y)[2] =  aw1;
            this.accel.get_cell(accel_coord, y)[4] = -aw1;

            this.accel.get_cell(accel_coord, y)[5] =  aw2;
            this.accel.get_cell(accel_coord, y)[6] =  aw2;
            this.accel.get_cell(accel_coord, y)[7] = -aw2;
            this.accel.get_cell(accel_coord, y)[8] = -aw2;
        }
    }
    this.iteration_number = -1;
    this.cells = new StepStorage(this.problem, [w0, w1, w1, w1, w1, w2, w2, w2, w2]);
    this.temp_cells = new StepStorage(this.problem);
    this.is_obstacle = this.problem.is_obstacle;
}

JSSimHelper.prototype.fetch_iteration = function(iteration, callback) {
    if(this.iteration_number > iteration) return -1;
    if(this.iteration == this.iteration_number) return this.cells;
    var temp;
    while(iteration > this.iteration_number) {
        timestep(this.problem, this.cells, this.accel, this.temp_cells);
        temp = this.cells;
        this.cells = this.temp_cells;
        this.temp_cells = temp;
        this.iteration_number ++;
    }
    callback(this, this.cells);
}

function RemoteSimHelper(address, steps, file_data) {
    console.log(address, file_data);
    JSSimHelper.call(this, steps, file_data);

    this.is_loaded = false;
    this.callbacks = [];
    this.address = address;
    var request = new XMLHttpRequest(), this_ = this;
    request.onreadystatechange = function() {
        if(this.readyState == XMLHttpRequest.DONE) {
            if(this.status == 200) {
                var data = JSON.parse(this.responseText);
                this_.id = data.id;
                this_.is_loaded = 1;
                console.log("Got id " + this_.id + ". Calling callbacks (" + this_.callbacks.length + ")...");
                for(var i = 0; i < this_.callbacks.length; i++) {
                    this_.callbacks[i]();
                }
            }
        }
    }
    request.open("POST", address + "create/" + steps, true);
    request.send(file_data);
}

RemoteSimHelper.prototype.on_load = function(callback) {
    if(this.is_loaded) return callback();
    this.callbacks.push(callback);
}

RemoteSimHelper.prototype.fetch_iteration = function(iteration, callback) {
    var me = this;
    this.on_load(function() {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if(this.readyState == XMLHttpRequest.DONE) {
                if(this.status == 200) {
                    var string = window.atob(JSON.parse(this.responseText).data);
                    var array = new ArrayBuffer(string.length);
                    var arrview = new Uint8Array(array);
                    for(var i = 0; i < string.length; i+=4) {
                        arrview[i] = string.charCodeAt(i+3);
                        arrview[i+1] = string.charCodeAt(i+2);
                        arrview[i+2] = string.charCodeAt(i+1);
                        arrview[i+3] = string.charCodeAt(i);
                    }
                    var data = new Float32Array(array);
                    /*for(var i = 0; i < me.size[0] * me.size[1] * 9; i++) {
                        var k = i % 9,
                            x = Math.floor(i / 9) % me.size[0],
                            y = Math.floor(i / 9 / me.size[0]);
                        me.cells.get_cell(x, y)[k] = data[i];
                    }*/
                    me.cells.get_cell = function(x, y) {
                        var id = 9*me.problem.get_cell_id(y, x);
                        return [data[id], data[id + 1], data[id + 2], data[id + 3], data[id + 4], data[id + 5], data[id + 6], data[id + 7], data[id + 8]];
                    }
                    callback(me, me.cells);
                } else callback(me, this.status - 404);
            }
        }
        request.open("GET", me.address + me.id + "/" + iteration, true);
        request.send();
    });
}

function createRemoteSimHelper(address) {
    return RemoteSimHelper.bind(null, address);
}

function DifferenceSimHelper(sim_helper1, sim_helper2, steps, file_data) {
    this.sim1 = new sim_helper1(steps, file_data);
    this.sim2 = new sim_helper2(steps, file_data);
    this.steps = steps;
    this.fd = file_data;


    this.cb1 = this.cb2 = null;
    this.callback = null;

    var data = file_data.split("\n"),
        density = parseFloat(data[4]),
        w0 = density * 4/9,
        w1 = w0 / 4,
        w2 = w1 / 4;
    this.size = [parseInt(data[0]), parseInt(data[1])];
    this.problem = new ProblemDefinition(this.size, 9, parseFloat(data[6]));
    this.is_obstacle = this.problem.is_obstacle = this.sim1.is_obstacle;
    this.cells = new StepStorage(this.problem, [w0, w1, w1, w1, w1, w2, w2, w2, w2]);
}

DifferenceSimHelper.prototype.cb = function(sub_sim, cells) {
    if(sub_sim == this.sim1) this.cb1 = cells;
    if(sub_sim == this.sim2) this.cb2 = cells;
    if(this.cb1 !== null && this.cb2 !== null) {
        for(var x = 0; x < this.size[0]; x++)
            for(var y = 0; y < this.size[1]; y++)
                for(var k = 0; k < 9; k++)
                    this.cells.get_cell(x, y)[k] = this.cb1.get_cell(x, y)[k] - this.cb2.get_cell(x, y)[k];
        this.cb1 = this.cb2 = null;
        this.callback(this, this.cells);
    }
};

DifferenceSimHelper.prototype.fetch_iteration = function(iteration, callback) {
    this.callback = callback;
    this.sim1.fetch_iteration(iteration, this.cb.bind(this));
    if(this.sim1 != this.sim2) this.sim2.fetch_iteration(iteration, this.cb.bind(this));
}



function createDifferenceSimHelper(simhelper1, simhelper2) {
    return DifferenceSimHelper.bind(null, simhelper1, simhelper2);
}
