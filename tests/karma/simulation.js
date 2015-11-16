describe("simulation.js", function() {
    beforeEach(function() {
        this.problem = new ProblemDefinition([3, 3], 9);
        this.prev_cells = new StepStorage(this.problem);
        this.next_cells = new StepStorage(this.problem);
    });

    describe("timestep", function() {
        it("one step", function() {
            this.prev_cells.get_cell(0, 0)[5] = 1;
            this.prev_cells.get_cell(1, 0)[2] = 1;
            this.prev_cells.get_cell(2, 0)[6] = 1;

            this.prev_cells.get_cell(0, 1)[1] = 1;
            this.prev_cells.get_cell(1, 1)[0] = 1;
            this.prev_cells.get_cell(2, 1)[3] = 1;

            this.prev_cells.get_cell(0, 2)[8] = 1;
            this.prev_cells.get_cell(1, 2)[4] = 1;
            this.prev_cells.get_cell(2, 2)[7] = 1;
            timestep(this.problem, this.prev_cells, this.next_cells,
                    this.next_cells);

            expect(this.next_cells.get_cell(1, 1)).
                    toEqual([4, 1, 1, 1, 1, 1/4, 1/4, 1/4, 1/4])

            for(var x = 0; x < 3; x ++) {
                for(var y = 0; y < 3; y++) {
                    if(x != 1 || y != 1) expect(this.next_cells.get_cell(x, y)).
                            toEqual([NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, 
                                    NaN]);
                }
            }
        });
    });

    describe("accelerate_cell", function() {
        it("single", function() {
            this.prev_cells.get_cell(0, 0)[1] = 2;
            this.prev_cells.get_cell(0, 0)[5] = 1;
            this.prev_cells.get_cell(0, 0)[8] = 1;

            accelerate_cell(this.problem, this.prev_cells, this.prev_cells, 
                    this.next_cells, [0, 0]);

            expect(this.next_cells.get_cell(0, 0)).
                    toEqual([0, 4, 0, 0, 0, 2, 0, 0, 2]);
        });
    });

    describe("propagate_cell", function() {
        it("single correctly", function() {
            this.prev_cells.get_cell(1, 1)[0] = 1;
            this.prev_cells.get_cell(1, 1)[1] = 1;
            this.prev_cells.get_cell(1, 1)[2] = 1;
            this.prev_cells.get_cell(1, 1)[3] = 1;
            this.prev_cells.get_cell(1, 1)[4] = 1;
            this.prev_cells.get_cell(1, 1)[5] = 1;
            this.prev_cells.get_cell(1, 1)[6] = 1;
            this.prev_cells.get_cell(1, 1)[7] = 1;
            this.prev_cells.get_cell(1, 1)[8] = 1;

            propagate_cell(this.problem, this.prev_cells, this.next_cells,
                    [1, 1]);

            expect(this.next_cells.get_cell(0, 2)).
                    toEqual([0, 0, 0, 0, 0, 0, 1, 0, 0]);
            expect(this.next_cells.get_cell(1, 2)).
                    toEqual([0, 0, 1, 0, 0, 0, 0, 0, 0]);
            expect(this.next_cells.get_cell(2, 2)).
                    toEqual([0, 0, 0, 0, 0, 1, 0, 0, 0]);

            expect(this.next_cells.get_cell(0, 1)).
                    toEqual([0, 0, 0, 1, 0, 0, 0, 0, 0]);
            expect(this.next_cells.get_cell(1, 1)).
                    toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0]);
            expect(this.next_cells.get_cell(2, 1)).
                    toEqual([0, 1, 0, 0, 0, 0, 0, 0, 0]);

            expect(this.next_cells.get_cell(0, 0)).
                    toEqual([0, 0, 0, 0, 0, 0, 0, 1, 0]);
            expect(this.next_cells.get_cell(1, 0)).
                    toEqual([0, 0, 0, 0, 1, 0, 0, 0, 0]);
            expect(this.next_cells.get_cell(2, 0)).
                    toEqual([0, 0, 0, 0, 0, 0, 0, 0, 1]);
        });

        it("over WRAP correctly", function() {
            this.prev_cells.get_cell(1, 0)[4] = 1;

            propagate_cell(this.problem, this.prev_cells, this.next_cells,
                    [1, 0]);

            expect(this.next_cells.get_cell(1, -1)).
                    toEqual([0, 0, 0, 0, 1, 0, 0, 0, 0]);
        });

        it("all correctly", function() {
            this.prev_cells.get_cell(1, 1)[0] = 1;
            this.prev_cells.get_cell(1, 1)[1] = 1;
            this.prev_cells.get_cell(1, 1)[2] = 1;
            this.prev_cells.get_cell(1, 1)[3] = 1;
            this.prev_cells.get_cell(1, 1)[4] = 1;
            this.prev_cells.get_cell(1, 1)[5] = 1;
            this.prev_cells.get_cell(1, 1)[6] = 1;
            this.prev_cells.get_cell(1, 1)[7] = 1;
            this.prev_cells.get_cell(1, 1)[8] = 1;

            for(var x = 0; x < 3; x ++) {
                for(var y = 0; y < 3; y++) {
                    propagate_cell(this.problem, this.prev_cells,
                            this.next_cells, [x, y]);
                }
            }

            expect(this.next_cells.get_cell(0, 2)).
                    toEqual([0, 0, 0, 0, 0, 0, 1, 0, 0]);
            expect(this.next_cells.get_cell(1, 2)).
                    toEqual([0, 0, 1, 0, 0, 0, 0, 0, 0]);
            expect(this.next_cells.get_cell(2, 2)).
                    toEqual([0, 0, 0, 0, 0, 1, 0, 0, 0]);

            expect(this.next_cells.get_cell(0, 1)).
                    toEqual([0, 0, 0, 1, 0, 0, 0, 0, 0]);
            expect(this.next_cells.get_cell(1, 1)).
                    toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0]);
            expect(this.next_cells.get_cell(2, 1)).
                    toEqual([0, 1, 0, 0, 0, 0, 0, 0, 0]);

            expect(this.next_cells.get_cell(0, 0)).
                    toEqual([0, 0, 0, 0, 0, 0, 0, 1, 0]);
            expect(this.next_cells.get_cell(1, 0)).
                    toEqual([0, 0, 0, 0, 1, 0, 0, 0, 0]);
            expect(this.next_cells.get_cell(2, 0)).
                    toEqual([0, 0, 0, 0, 0, 0, 0, 0, 1]);
        });

        it("all over WRAP correctly", function() {
            this.prev_cells.get_cell(1, 1)[0] = 1;
            this.prev_cells.get_cell(1, 1)[1] = 1;
            this.prev_cells.get_cell(1, 1)[2] = 1;
            this.prev_cells.get_cell(1, 1)[3] = 1;
            this.prev_cells.get_cell(1, 1)[4] = 1;
            this.prev_cells.get_cell(1, 1)[5] = 1;
            this.prev_cells.get_cell(1, 1)[6] = 1;
            this.prev_cells.get_cell(1, 1)[7] = 1;
            this.prev_cells.get_cell(1, 1)[8] = 1;
            var a = this.prev_cells.clone(), b = this.next_cells;

            for(var j = 0; j < 3; j++) {
                for(var x = 0; x < 3; x ++) {
                    for(var y = 0; y < 3; y++) {
                        propagate_cell(this.problem, a, b, [x, y]);
                    }
                }
                temp = a;
                a = b;
                b = temp;
            }

            this.next_cells = a;

            for(var x = 0; x < 3; x ++) {
                for(var y = 0; y < 3; y++) {
                    expect(this.next_cells.get_cell(x, y)).
                            toEqual(this.prev_cells.get_cell(x, y));
                }
            }
        });
    });

    describe("rebound_cell", function() {
        it("single", function() {
            this.prev_cells.get_cell(0, 0)[0] = 0;
            this.prev_cells.get_cell(0, 0)[1] = 1;
            this.prev_cells.get_cell(0, 0)[2] = 2;
            this.prev_cells.get_cell(0, 0)[3] = 3;
            this.prev_cells.get_cell(0, 0)[4] = 4;
            this.prev_cells.get_cell(0, 0)[5] = 5;
            this.prev_cells.get_cell(0, 0)[6] = 6;
            this.prev_cells.get_cell(0, 0)[7] = 7;
            this.prev_cells.get_cell(0, 0)[8] = 8;

            rebound_cell(this.problem, this.prev_cells, this.next_cells,
                    [0, 0]);


            expect(this.next_cells.get_cell(0, 0)).
                    toEqual([0, 3, 4, 1, 2, 7, 8, 5, 6]);

            expect(this.next_cells.get_cell(0, 2)).
                    toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
            expect(this.next_cells.get_cell(1, 2)).
                    toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
            expect(this.next_cells.get_cell(2, 2)).
                    toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);

            expect(this.next_cells.get_cell(0, 1)).
                    toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
            expect(this.next_cells.get_cell(1, 1)).
                    toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
            expect(this.next_cells.get_cell(2, 1)).
                    toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);

            expect(this.next_cells.get_cell(1, 0)).
                    toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
            expect(this.next_cells.get_cell(2, 0)).
                    toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
        });
    });

    describe("collision_cell", function() {
        it('single zero', function() {
            this.prev_cells.storage[0] = [1, 1, 1, 1, 1, 1, 1, 1, 1];
            collision_cell(this.problem, this.prev_cells, this.next_cells,
                    [0, 0]);
            expect(this.next_cells.get_cell(0, 0)).
                    toEqual([4, 1, 1, 1, 1, 1/4, 1/4, 1/4, 1/4])
        })
    });
});