describe("storage.js", function() {
    describe("ProblemDefinition", function() {
        it('correct cell count', function() {
            expect((new ProblemDefinition([3])).get_cell_count()).toBe(3);
            expect((new ProblemDefinition([3, 5])).get_cell_count()).
                    toBe(3 * 5);
            expect((new ProblemDefinition([3, 5, 7])).get_cell_count()).
                    toBe(3 * 5 * 7);
        });

        it('get_cell_id is correct', function() {
            var problem = new ProblemDefinition([3, 5]);
            expect(problem.get_cell_id(0, 3)).toBe(3);
            expect(problem.get_cell_id(2, 0)).toBe(10);
            expect(problem.get_cell_id(1, 2)).toBe(7);
        });

        it('get_cell_id WRAP is correct', function() {
            var problem = new ProblemDefinition([3, 5], null, 
                    ProblemDefinition.EDGE_TYPE.WRAP);
            expect(problem.get_cell_id(0, -1)).toBe(4);
            expect(problem.get_cell_id(0, 7)).toBe(2);
            expect(problem.get_cell_id(4, 0)).toBe(5);
            expect(problem.get_cell_id(-2, 0)).toBe(5);
            expect(problem.get_cell_id(-1, 6)).toBe(11);
        });

        it('get_cell_id ZERO is correct', function() {
            var problem = new ProblemDefinition([3, 5], null, 
                    ProblemDefinition.EDGE_TYPE.ZERO);
            expect(problem.get_cell_id(0, -1)).toBe(-1);
            expect(problem.get_cell_id(0, 7)).toBe(-1);
            expect(problem.get_cell_id(4, 0)).toBe(-1);
            expect(problem.get_cell_id(-2, 0)).toBe(-1);
            expect(problem.get_cell_id(-1, 6)).toBe(-1);
        });

        it('get_cell_id VALUE is correct', function() {
            var problem = new ProblemDefinition([3, 5], null, 
                    ProblemDefinition.EDGE_TYPE.VALUE);
            expect(problem.get_cell_id(0, -1)).toBe(-1);
            expect(problem.get_cell_id(0, 7)).toBe(-1);
            expect(problem.get_cell_id(4, 0)).toBe(-1);
            expect(problem.get_cell_id(-2, 0)).toBe(-1);
            expect(problem.get_cell_id(-1, 6)).toBe(-1);
        });
    });



    describe("StepStorage", function() {
        beforeEach(function() {
            this.problem = new ProblemDefinition([3, 3]);
        })

        it('array size', function() {
            var step = new StepStorage(this.problem);
            expect(step.storage.length).toBe(this.problem.get_cell_count());
        });

        it('default values', function() {
            var step = new StepStorage(this.problem);
            for(var i = 0; i < this.problem.get_cell_count(); i++) {
                for(var j = 0; j < this.problem.speeds; j++) {
                    expect(step.storage[i][j]).toBe(0);
                }
            }
        });

        it('initial_value as number', function() {
            var step = new StepStorage(this.problem, 10);
            for(var i = 0; i < this.problem.get_cell_count(); i++) {
                for(var j = 0; j < this.problem.speeds; j++) {
                    expect(step.storage[i][j]).toBe(10);
                }
            }
        });

        it('initial_value as Number', function() {
            var number = new Number(10);
            var step = new StepStorage(this.problem, number);
            for(var i = 0; i < this.problem.get_cell_count(); i++) {
                for(var j = 0; j < this.problem.speeds; j++) {
                    expect(step.storage[i][j]).toBe(number);
                }
            }
        });

        it('initial_value as Array', function() {
            var speeds = [0, 1, 2, 3, 4];
            var step = new StepStorage(this.problem, speeds);
            for(var i = 0; i < this.problem.get_cell_count(); i++) {
                expect(step.storage[i]).toEqual(speeds);
            }
        });

        it('initial_vale array size validation', function() {
            var speeds = [0, 1];
            expect(function() {
                new StepStorage(this.problem, speeds);
            }).toThrow();
        });

        it('get_cell validation', function() {
            var step = new StepStorage(this.problem);
            expect(function() {
                step.get_cell();
            }).toThrow();
            expect(function() {
                step.get_cell(0);
            }).toThrow();
            expect(function() {
                step.get_cell(0, 1);
            }).not.toThrow();
            expect(function() {
                step.get_cell(0, 1, 2);
            }).toThrow();
        });

        it('get_cell returns valid array', function() {
            var step = new StepStorage(this.problem);
            expect(step.get_cell(0, 0)).toEqual([0, 0, 0, 0, 0]);
        });

        it('get_cell returns correct array', function() {
            var step = new StepStorage(this.problem);
            for(var i = 0; i < this.problem.size[0]; i++) {
                for(var j = 0; j < this.problem.size[1]; j++) {
                    expect(step.storage[i*this.problem.size[1] + j]).
                            toBe(step.get_cell(i, j));
                }
            }
        });

        it('get_cell update updates original exclusively', function() {
            var step = new StepStorage(this.problem);
            var speeds = step.get_cell(1, 1);
            speeds[0] = 1;
            speeds[1] = 2;
            expect(step.get_cell(1, 1)).toEqual([1, 2, 0, 0, 0]);
            expect(step.storage.every(function(cell, index) {
                return index == (1 * this.problem.size[1] + 1) ||
                        cell.every(function(v) {return v === 0;});
            }, this)).toBe(true);
        });

        it('get_cell returns zero when ZERO and outside bounds', function() {
            this.problem = new ProblemDefinition([3, 3], null, 
                    ProblemDefinition.EDGE_TYPE.ZERO);
            var step = new StepStorage(this.problem, [1, 1, 1, 1, 1]);
            expect(step.get_cell(-1,  0)).toEqual([0, 0, 0, 0, 0]);
            expect(step.get_cell( 0, -1)).toEqual([0, 0, 0, 0, 0]);
            expect(step.get_cell(-1, -1)).toEqual([0, 0, 0, 0, 0]);
            expect(step.get_cell(-1,  4)).toEqual([0, 0, 0, 0, 0]);
            expect(step.get_cell( 4, -1)).toEqual([0, 0, 0, 0, 0]);
            expect(step.get_cell( 4,  4)).toEqual([0, 0, 0, 0, 0]);
        });


        it('get_cell returns edge_value when VALUE and outside bounds', 
                function() {
            var test_value = [0, 1, 2, 3, 4];
            this.problem = new ProblemDefinition([3, 3], null, 
                    ProblemDefinition.EDGE_TYPE.VALUE, test_value);
            var step = new StepStorage(this.problem, [1, 1, 1, 1, 1]);
            expect(step.get_cell(-1,  0)).toEqual(test_value);
            expect(step.get_cell( 0, -1)).toEqual(test_value);
            expect(step.get_cell(-1, -1)).toEqual(test_value);
            expect(step.get_cell(-1,  4)).toEqual(test_value);
            expect(step.get_cell( 4, -1)).toEqual(test_value);
            expect(step.get_cell( 4,  4)).toEqual(test_value);
        });

        it('get_cell returns clones and not the original when outside bounds',
                function() {
            this.problem = new ProblemDefinition([3, 3], null, 
                    ProblemDefinition.EDGE_TYPE.ZERO);
            var step = new StepStorage(this.problem, [1, 1, 1, 1, 1]);
            expect(step.get_cell(-1,  0)).not.toBe(step.get_cell(0, -1));
        });

        it('clone correct', function() {
            var step = new StepStorage(this.problem);
            var new_step = step.clone();
            for(var i = 0; i < this.problem.get_cell_count(); i++) {
                expect(step.storage[i]).toEqual(new_step.storage[i]);
                expect(step.storage[i]).not.toBe(new_step.storage[i]);
            }
        });
    });
});