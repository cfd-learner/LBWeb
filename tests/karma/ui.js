describe("ui.js", function() {
    describe("file change", function() {
        it("Correctly load file", function(done) {
            expect(LBUI.get_problem()).toBe(null);
            this.files = [new Blob([
                    "3\n",
                    "5\n",
                    "1000\n",
                    "10\n",
                    "0.1\n",
                    "0.005\n",
                    "1.85\n",
                    "accelerate row 7\n",
                    "1 obstacles\n",
                    "0 0 10 100\n"
                    ])];

            document.addEventListener('LB_problem_change', function(e) {
                expect(LBUI.get_problem()).not.toBe(null);
                expect(LBUI.get_problem().size).toEqual([3, 5]);
                expect(LBUI.get_problem().is_obstacle([0, 0])).toBe(true);
                expect(LBUI.get_problem().is_obstacle([1, 0])).toBe(false);
                done();
            });

            LBUI.problem_file_change.apply(this);
        });
    });
});