/*
 * This file is coded assuming a D2Q9 problem for now.
 */

function timestep(problem, old_state, accel_state, new_state) {
    var temp1 = new StepStorage(problem),
        temp2 = new StepStorage(problem);
    for(var x = 0; x < problem.size[0]; x++) {
        for(var y = 0; y < problem.size[1]; y++) {
            accelerate_cell(problem, old_state, accel_state, temp1, [x, y]);
        }
    }
    for(var x = 0; x < problem.size[0]; x++) {
        for(var y = 0; y < problem.size[1]; y++) {
            propagate_cell(problem, temp1, temp2, [x, y]);
        }
    }
    for(var x = 0; x < problem.size[0]; x++) {
        for(var y = 0; y < problem.size[1]; y++) {
            if(problem.is_obstacle(x, y)) {
                rebound_cell(problem, temp2, new_state, [x, y]);
            } else {
                collision_cell(problem, temp2, new_state, [x, y]);
            }
        }
    }
}

function accelerate_cell(problem, old_state, accel_state, new_state,
        cell_coords) {
    var x = cell_coords[0],
        y = cell_coords[1];

    for(var i = 0; i < 9; i += 1) {
        new_state.get_cell(x, y)[i] = old_state.get_cell(x, y)[i] + 
                accel_state.get_cell(x, y)[i];
    }

}

function propagate_cell(problem, old_state, new_state, cell_coords) {
    var x = cell_coords[0],
        y = cell_coords[1];

    new_state.get_cell(x, y)[0] = old_state.get_cell(x, y)[0];

    new_state.get_cell(x + 1, y)[1] = old_state.get_cell(x, y)[1];
    new_state.get_cell(x, y + 1)[2] = old_state.get_cell(x, y)[2];
    new_state.get_cell(x - 1, y)[3] = old_state.get_cell(x, y)[3];
    new_state.get_cell(x, y - 1)[4] = old_state.get_cell(x, y)[4];

    new_state.get_cell(x + 1, y + 1)[5] = old_state.get_cell(x, y)[5];
    new_state.get_cell(x - 1, y + 1)[6] = old_state.get_cell(x, y)[6];
    new_state.get_cell(x - 1, y - 1)[7] = old_state.get_cell(x, y)[7];
    new_state.get_cell(x + 1, y - 1)[8] = old_state.get_cell(x, y)[8];
}

function rebound_cell(problem, old_state, new_state, cell_coords) {
    var x = cell_coords[0],
        y = cell_coords[1],
        from = old_state.get_cell(x, y);
        to = new_state.get_cell(x, y);
    to[0] = from[0];

    to[1] = from[3];
    to[2] = from[4];
    to[3] = from[1];
    to[4] = from[2];

    to[5] = from[7];
    to[6] = from[8];
    to[7] = from[5];
    to[8] = from[6];
}

function collision_cell(problem, old_state, new_state, cell_coords) {
    var x = cell_coords[0],
        y = cell_coords[1],
        from = old_state.get_cell(x, y),
        to = new_state.get_cell(x, y),
        c_sq = 1/3,
        w0 = 4/9,
        w1 = 1/9,
        w2 = 1/36,
        local_density,
        u_x,
        u_y,
        u_sq,
        u = [],
        d_equ = [];

    local_density = from.reduce(function(a, b) {
        return a + b;
    });

    u_x = (from[1] + from[5] + from[8] - (from[3] + from[6] + from[7])) / 
            local_density;
    u_y = (from[2] + from[5] + from[6] - (from[4] + from[7] + from[8])) / 
            local_density;

    u_sq = u_x * u_x + u_y * u_y;

    u[1] = u_x;
    u[2] = u_y;
    u[3] = -u_x;
    u[4] = -u_y;

    u[5] = u_x + u_y;
    u[6] = - u_x + u_y;
    u[7] = - u_x - u_y;
    u[8] = u_x - u_y;

    d_equ[0] = w0 * local_density * (1.0 - u_sq / (2.0 * c_sq));
    d_equ[1] = w1 * local_density * (1.0 + u[1] / c_sq
        + (u[1] * u[1]) / (2.0 * c_sq * c_sq)
        - u_sq / (2.0 * c_sq));
    d_equ[2] = w1 * local_density * (1.0 + u[2] / c_sq
        + (u[2] * u[2]) / (2.0 * c_sq * c_sq)
        - u_sq / (2.0 * c_sq));
    d_equ[3] = w1 * local_density * (1.0 + u[3] / c_sq
        + (u[3] * u[3]) / (2.0 * c_sq * c_sq)
        - u_sq / (2.0 * c_sq));
    d_equ[4] = w1 * local_density * (1.0 + u[4] / c_sq
        + (u[4] * u[4]) / (2.0 * c_sq * c_sq)
        - u_sq / (2.0 * c_sq));
    d_equ[5] = w2 * local_density * (1.0 + u[5] / c_sq
        + (u[5] * u[5]) / (2.0 * c_sq * c_sq)
        - u_sq / (2.0 * c_sq));
    d_equ[6] = w2 * local_density * (1.0 + u[6] / c_sq
        + (u[6] * u[6]) / (2.0 * c_sq * c_sq)
        - u_sq / (2.0 * c_sq));
    d_equ[7] = w2 * local_density * (1.0 + u[7] / c_sq
        + (u[7] * u[7]) / (2.0 * c_sq * c_sq)
        - u_sq / (2.0 * c_sq));
    d_equ[8] = w2 * local_density * (1.0 + u[8] / c_sq
        + (u[8] * u[8]) / (2.0 * c_sq * c_sq)
        - u_sq / (2.0 * c_sq));

    /* relaxation step */
    for (var i = 0; i < 9; i++)
    {
        to[i] = (from[i] + problem.omega * (d_equ[i] - from[i]));
    }
}