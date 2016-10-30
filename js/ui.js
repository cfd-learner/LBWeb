
// UI Closure
LBUI = (function() {
    var canvas = null,
        ctxt = null,
        cells = null,
        cell_size = 3,
        border = 0,
        interval = null,
        iter = 0,
        iter_plus = 10,
        iterations = 0,
        sim_helper = null,
        sim_helper_class = JSSimHelper,
        interval_time = 100,
        mouse_pos = {
            x: -1,
            y: -1,
            quadrant: -1,
        },
        av_bounds = {
            min: 0,
            max: 0,
            diff: 0
        };

    var fr = new FileReader();
    fr.onload = function() {
        iterations = fr.result.split("\n")[2];
        iter = 0;
        var my_event = new Event('LB_problem_change');
        sim_helper = new sim_helper_class(iter_plus, fr.result);
        document.dispatchEvent(my_event);
        if(interval) clearTimeout(interval);
        setTimeout(step, interval_time);
    }

    function step_finish(helper, _cells) {
        if(helper != sim_helper) return;
        if(_cells != -1 && _cells != -2) {
            cells = _cells;
            recalc_av_bounds();
            update_canvas();
        }
        if(iter >= iterations) return;
        iter += iter_plus;
        //if(iter % 50 < (iter - iter_plus) % 50) {
            console.log("iter " + iter);
        //}
        setTimeout(step, interval_time);
    }

    function problem_file_change() {
        var file = this.files[0];
        if(fr.readyState == 1) {
            fr.abort();
        }
        fr.readAsText(file);
    }

    function set_canvas_element(elem) {
        canvas = elem;
        ctxt = canvas.getContext("2d");
        canvas.addEventListener('mousemove', canvas_mouse_move);
        canvas.addEventListener('mouseleave', canvas_mouse_out);
    }

    function canvas_mouse_move(event) {
        var c_tl, browser_x, browser_y, quad;
        c_tl = canvas.getBoundingClientRect();
        browser_x = event.clientX - c_tl.left;
        browser_y = c_tl.bottom - event.clientY;
        if(sim_helper) {
            mouse_pos.x = sim_helper.size[0] * browser_x / c_tl.width;
            mouse_pos.y = sim_helper.size[1] * browser_y / c_tl.height;
            quad = (mouse_pos.x > sim_helper.size[0]/2) + 
                    2 * (mouse_pos.y > sim_helper.size[1]/2);
            if(mouse_pos.quadrant != -1 && quad != mouse_pos.quadrant) {
                redraw_cells();
            }
            mouse_pos.quadrant = quad;
            redraw_mouse_over();
        }
    }

    function canvas_mouse_out(event) {
        mouse_pos.x = mouse_pos.y = mouse_pos.quadrant = -1;
        redraw_cells();
    }

    function update_canvas() {
        if(!canvas) {
            console.log("Canvas update with no canvas!");
            return;
        }
        redraw_cells();
        redraw_mouse_over();
    }

    function recalc_av_bounds() {
        if(cells == null) return;
        av_bounds.min = av_bounds.max = null
        for(var y = 0; y < sim_helper.size[1]; y++) {
            for(var x = 0; x < sim_helper.size[0]; x ++) {
                if(sim_helper.is_obstacle(x, y)) {
                    continue;
                }
                var av = av_vel(sim_helper, cells, [x, y])
                if(av_bounds.max == null || av > av_bounds.max) av_bounds.max = av;
                if(av_bounds.min == null || av < av_bounds.min) av_bounds.min = av;
            }
        }
        av_bounds.diff = av_bounds.max - av_bounds.min;
    }

    function redraw_cells() {
        canvas.width = sim_helper.size[0] * cell_size;
        if(border) canvas.width += sim_helper.size[0] + 1;
        canvas.height = sim_helper.size[1] * cell_size;
        if(border) canvas.height += sim_helper.size[1] + 1;
        ctxt.fillStyle = "black";
        ctxt.fillRect(0, 0, canvas.width, canvas.height);

        if(cells == null) return;
        var quad;
        for(var y = 0; y < sim_helper.size[1]; y++) {
            for(var x = 0; x < sim_helper.size[0]; x ++) {
                quad = (x > sim_helper.size[0]/2) + 
                        2 * (y > sim_helper.size[1]/2);
                if(3 - mouse_pos.quadrant == quad) continue;
                if(sim_helper.is_obstacle(x, y)) {
                    continue;
                }
                var av = av_vel(sim_helper, cells, [x, y]);
                if(av_bounds.diff != 0) {
                    var val, r = 0, g = 0, b = 0;
                    val = Math.floor(768*(av - av_bounds.min)/av_bounds.diff);
                    if(val < 512) {
                        b = 256 - Math.abs(val - 256);
                    }
                    if(255 < val && val < 768) {
                        r = 256 - Math.abs(val - 512);
                    }
                    if(512 < val) {
                        g = 256 - Math.abs(val - 768);
                    }
                    ctxt.fillStyle = "rgb(" + r +"," + g + "," + b + ")";
                } else ctxt.fillStyle = "rgb(0,0,0)";
                ctxt.fillRect(1 + x*cell_size,
                        canvas.height - (border + y*(cell_size + border)),
                        cell_size - border, -cell_size + border);
            }
        }
    }

    function redraw_mouse_over() {
        if(mouse_pos.x != -1) {
            var draw_quad = 3 - mouse_pos.quadrant;
            var min_x = 0, max_x = sim_helper.size[0]/2,
                    min_y = 0, max_y = sim_helper.size[1]/2;
            if(draw_quad > 1) {
                min_y += sim_helper.size[1] / 2;
                max_y += sim_helper.size[1] / 2;
            }
            if(draw_quad & 1) {
                min_x += sim_helper.size[0] / 2;
                max_x += sim_helper.size[0] / 2;
            }
            var avg_x = min_x + (max_x - min_x) / 2;
            var avg_y = min_y + (max_y - min_y) / 2;
            for(var dx = min_x; dx < max_x; dx++) {
                for(var dy = min_y; dy < max_y; dy ++) {
                    var x = Math.floor(mouse_pos.x  + (dx - avg_x) / 3);
                    var y = Math.floor(mouse_pos.y  + (dy - avg_y) / 3);

                    if(sim_helper.is_obstacle(x, y)) {
                        ctxt.fillStyle = "black";
                    } else {
                        var av = av_vel(sim_helper, cells, [x, y]);
                        if(av_bounds.diff != 0) {
                            var val, r = 0, g = 0, b = 0;
                            val = Math.floor(768*(av - av_bounds.min)/av_bounds.diff);
                            if(val < 512) {
                                b = 256 - Math.abs(val - 256);
                            }
                            if(255 < val && val < 768) {
                                r = 256 - Math.abs(val - 512);
                            }
                            if(512 < val) {
                                g = 256 - Math.abs(val - 768);
                            }
                            ctxt.fillStyle = "rgb(" + r +"," + g + "," + b + ")";
                        } else ctxt.fillStyle = "rgb(0,0,0)";
                    }
                    ctxt.fillRect(1 + dx*cell_size,
                            canvas.height - (border + dy*(cell_size + border)),
                            cell_size - border, -cell_size + border);
                }
            }
        }
    }

    function step() {
        sim_helper.fetch_iteration(iter, step_finish);
    }

    function set_sim_helper_class(klass) {
        sim_helper_class = klass;
    }

    document.addEventListener('LB_problem_change', update_canvas);

    return {
        get_problem: function() {return sim_helper;},
        problem_file_change: problem_file_change,
        set_canvas_element: set_canvas_element,
        step: step,
        update_canvas: update_canvas,
        set_interval_time: function(time) {
            interval_time = time;
        },
        set_iteration_step: function(step) {
            iter_plus = step;
        },
        set_sim_helper_class: set_sim_helper_class
    };

})();

//LBUI.set_sim_helper_class(createRemoteSimHelper("http://meiamso.me:9001/"))
//LBUI.set_sim_helper_class(createRemoteSimHelper("http://192.168.0.169:8081/"))
LBUI.set_sim_helper_class(createRemoteSimHelper("http://localhost:8081/"))
