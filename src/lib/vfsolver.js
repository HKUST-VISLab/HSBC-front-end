/*
Add comments to describe this file
eslint-disable */
import * as d3 from "d3";
import _ from 'underscore'


export default {
    createField: function (opts) {
        opts = _.defaults(opts, {
            width: 5,
            height: 5,
            smooth: 0.15,
            domainX: d3.scaleLinear(),
            domainY: d3.scaleLinear()
        });
        if (_.isUndefined(opts.constraints)) {
            throw new Error("'constraints' is a required option");
        }
        var width = opts.width, height = opts.height;
        opts.domainX.range([0, width]);
        opts.domainY.range([0, height]);

        opts.constraints = _.map(opts.constraints, function(constraint) {
            return {
                x: opts.domainX(constraint.x),
                y: opts.domainY(constraint.y),
                vx: constraint.vx,
                vy: constraint.vy
            };
        });

        var solver = this.createSolver(opts);

        // var vfX = _.map(solver.solve(_.pluck(opts.constraints, "vx")), opts.domainX);
        // var vfY = _.map(solver.solve(_.pluck(opts.constraints, "vy")), opts.domainY);

        var vfX = solver.solve(_.pluck(opts.constraints, "vx"));
        var vfY = solver.solve(_.pluck(opts.constraints, "vy"));

        function ix(row, column) {
            return (row + 1) * (width + 2) + (column + 1);
        }

        return {
            field: [vfX, vfY],
            eval: function(x, y) {
                x = opts.domainX(x); //把输入的值从输入映射到[0,width]
                y = opts.domainY(y);
                var row = Math.floor(y), rowNext = row + 1,
                    col = Math.floor(x), colNext = col + 1,
                    u = x - col, v = y - row;

                function evalField(field) {
                    var xTop  = (1-u) * field[ix(row,   col)] + u * field[ix(row,   col+1)];
                    var xBot  = (1-u) * field[ix(row+1, col)] + u * field[ix(row+1, col+1)];
                    return (1-v) * xTop + v * xBot;
                }

                return [evalField(vfX), evalField(vfY)];
            }
        };
    },

    createSolver: function(opts){
        opts = _.defaults(opts, {
            width: 5,
            height: 5,
            smooth: 0.15
        });
        if (_.isUndefined(opts.constraints)) {
            throw new Error("'constraints' is a required option");
        }
        var width = opts.width, height = opts.height;
        var aw = width + 2, ah = height + 2;
        function ix(row, column) {
            return (row + 1) * (width + 2) + (column + 1);
        }
        function create(v) {
            return new Float64Array(v || ((2 + width) * (2 + height)));
        }
        function pad(v) {
            var i;
            for (i=0; i<width; ++i) {
                v[ix(-1, i)]     = v[ix(0, i)];
                v[ix(height, i)] = v[ix(height-1, i)];
            }
            for (i=-1; i<=height; ++i) {
                v[ix(i, -1)]    = v[ix(i, 0)];
                v[ix(i, width)] = v[ix(i, width-1)];
            }
            return v;
        }
        function lx(v) {
            var result = create(v);
            for (var row = 0; row < height; ++row) {
                for (var col = 0; col < width; ++col) {
                    var i = ix(row, col);
                    var sum = 0, count = 0;
                    if (row > 0) {
                        sum += v[ix(row-1, col)];
                        count++;
                    }
                    if (row < height - 1) {
                        sum += v[ix(row+1, col)];
                        count++;
                    }
                    if (col > 0) {
                        sum += v[ix(row, col-1)];
                        count++;
                    }
                    if (col < width - 1) {
                        sum += v[ix(row, col+1)];
                        count++;
                    }
                    result[i] -= sum / count; //here is the smoothing part!!!!
                }
            }
            return pad(result);
        }
        function c(vec) {
            var result = new Float64Array(opts.constraints.length);
            for (var i=0; i<opts.constraints.length; ++i) {
                var c = opts.constraints[i];
                var y = c.y;
                var x = c.x;
                var row = Math.floor(y), rowNext = row + 1,
                    col = Math.floor(x), colNext = col + 1,
                    u = x - col, v = y - row;
                // xTop = (1-u) * vec[row,   col] + u * vec[row, col+1]
                // xBot = (1-u) * vec[row+1, col] + u * vec[row+1, col+1]
                // v = (1-v) * xTop + v * xBot
                //
                // inner products of rows
                var xTop  = (1-u) * vec[ix(row,   col)] + u * vec[ix(row,   col+1)];
                var xBot  = (1-u) * vec[ix(row+1, col)] + u * vec[ix(row+1, col+1)];
                result[i] = (1-v) * xTop + v * xBot;
            }
            return result;
        }
        function ct(vec) {
            var result = create();
            for (var i=0; i<opts.constraints.length; ++i) {
                var c = opts.constraints[i];
                var y = c.y;
                var x = c.x;
                var row = Math.floor(y), rowNext = row + 1,
                    col = Math.floor(x), colNext = col + 1,
                    u = x - col, v = y - row;
                // xTop = (1-u) * vec[row,   col] + u * vec[row, col+1]
                // xBot = (1-u) * vec[row+1, col] + u * vec[row+1, col+1]
                // v = (1-v) * xTop + v * xBot
                //
                // linear combinations of columns:
                result[ix(row, col)]     += vec[i] * (1-u) * (1-v);
                result[ix(row+1, col)]   += vec[i] * (1-u) * (v);
                result[ix(row, col+1)]   += vec[i] * (u)   * (1-v);
                result[ix(row+1, col+1)] += vec[i] * (u)   * (v);
            }
            return pad(result);
        }

        function applyATA(v) {
            var ltlv = lx(lx(v));
            var ctcv = ct(c(v));
            var result = create();
            for (var row=0; row<height; ++row) {
                for (var col=0; col<width; ++col) {
                    var i = ix(row, col);
                    result[i] = ltlv[i] * opts.smooth + ctcv[i] * (1 - opts.smooth);
                }
            }
            return pad(result);
        }

        // minimal required dumb implementation of level-1 blas
        function daxpy(y, a, x) {
            for (var i=0; i<y.length; ++i)
                y[i] += a * x[i];
            return y;
        }
        function dscal(y, a) {
            for (var i=0; i<y.length; ++i)
                y[i] = a * y[i];
            return y;
        }
        function ddot(v1, v2) {
            var result = 0;
            for (var row=0; row<height; ++row) {
                for (var col=0; col<width; ++col) {
                    var i = ix(row, col);
                    result += v1[i] * v2[i];
                }
            }
            // for (var i=0; i<v1.length; ++i)
            //     result += v1[i] * v2[i];
            return result;
        }

        // A^T = [L c^T]
        // since we'll always be solving systems of the shape
        // Ax = b, where b = [0; constraintValues]
        // and since we only need A^T x as an operation for computing AT^b,
        // then we do not actually need to anything but the constraint values here.
        function applyAT(constraintValues) {
            var ctv = ct(constraintValues);
            return pad(ctv);
        }
        function conjugateGradients(constraintValues, guess) {
            var x_next, r_next, beta_next, d_next, r_next_l2;
            var b = applyAT(constraintValues);
            if (_.isUndefined(guess))
                guess = create();

            // d_0, r_0, a_0, x_0
            var x_i = guess;
            var Ax_i = applyATA(x_i);
            var d_i = dscal(create(b), 1 - opts.smooth);
            daxpy(d_i, -1, Ax_i);
            var r_i = d_i;
            var r_i_l2 = ddot(r_i, r_i);
            if (r_i_l2 === 0)
                return x_i;

            // FIXME adaptive number of steps, diagonal preconditioning
            for (var i=0; i<100; ++i) { //May need to change to a large value
                var Ad_i = applyATA(d_i);
                var alpha_i = r_i_l2 / ddot(d_i, Ad_i);

                x_next = daxpy(create(x_i), alpha_i, d_i);
                r_next = daxpy(create(r_i), -alpha_i, Ad_i);
                r_next_l2 = ddot(r_next, r_next);
                beta_next = r_next_l2 / r_i_l2;
                d_next = daxpy(create(r_next), beta_next, d_i);

                if (r_next_l2 === 0) // IF ERROR IS ZERO.
                    return x_next;
                x_i = x_next;
                r_i = r_next;
                d_i = d_next;
                r_i_l2 = r_next_l2;
            }
            return x_i;
        }

        return {
            solve: conjugateGradients
        };
    }
}

// export default {
//     createField: function (opts) {
//         opts = Object.assign(opts, {
//             width: 5,
//             height: 5,
//             smooth: 0.15,
//             domainX: d3.scaleLinear(),
//             domainY: d3.scaleLinear()
//         });
//         if (typeof (opts.constraints) === "undefined") {
//             throw new Error("'constraints' is a required option");
//         }
//         var width = opts.width, height = opts.height;
//         opts.domainX.range([0, width]);
//         opts.domainY.range([0, height]);

//         opts.constraints = opts.constraints.map(function(constraint) {
//             return {
//                 x: opts.domainX(constraint.x),
//                 y: opts.domainY(constraint.y),
//                 vx: constraint.vx,
//                 vy: constraint.vy
//             };
//         });

//         var solver = this.createSolver(opts);

//         var vfX = solver.solve(opts.constraints.map(item=>item.vx)); // solver.solve(_.pluck(opts.constraints, "vx"));
//         var vfY = solver.solve(opts.constraints.map(item=>item.vy)); // solver.solve(_.pluck(opts.constraints, "vy"));
//         console.log("vfX: ", vfX)
//         console.log("vfY: ", vfY)
//         function ix(row, column) {
//             return (row + 1) * (width + 2) + (column + 1);
//         }

//         return {
//             field: [vfX, vfY],
//             eval: function(x, y) {
//                 x = opts.domainX(x); //把输入的值从输入映射到[0,width]
//                 y = opts.domainY(y);
//                 var row = Math.floor(y), rowNext = row + 1,
//                     col = Math.floor(x), colNext = col + 1,
//                     u = x - col, v = y - row;

//                 function evalField(field) {
//                     var xTop  = (1-u) * field[ix(row,   col)] + u * field[ix(row,   col+1)];
//                     var xBot  = (1-u) * field[ix(row+1, col)] + u * field[ix(row+1, col+1)];
//                     return (1-v) * xTop + v * xBot;
//                 }
//                 return [evalField(vfX), evalField(vfY)];
//             }
//         };
//     },

//     createSolver: function (opts) {
//         opts = Object.assign(opts, {
//             width: 5,
//             height: 5,
//             smooth: 0.15
//         });
//         if (typeof (opts.constraints) === "undefined") {
//             throw new Error("'constraints' is a required option");
//         }
//         var width = opts.width, height = opts.height;
//         var aw = width + 2, ah = height + 2;
//         function ix(row, column) {
//             return (row + 1) * (width + 2) + (column + 1);
//         }
//         function create(v) {
//             return new Float64Array(v || ((2 + width) * (2 + height)));
//         }
//         function pad(v) {
//             var i;
//             for (i=0; i<width; ++i) {
//                 v[ix(-1, i)]     = v[ix(0, i)];
//                 v[ix(height, i)] = v[ix(height-1, i)];
//             }
//             for (i=-1; i<=height; ++i) {
//                 v[ix(i, -1)]    = v[ix(i, 0)];
//                 v[ix(i, width)] = v[ix(i, width-1)];
//             }
//             return v;
//         }
//         function lx(v) {
//             var result = create(v);
//             for (var row = 0; row < height; ++row) {
//                 for (var col = 0; col < width; ++col) {
//                     var i = ix(row, col);
//                     var sum = 0, count = 0;
//                     if (row > 0) {
//                         sum += v[ix(row-1, col)];
//                         count++;
//                     }
//                     if (row < height - 1) {
//                         sum += v[ix(row+1, col)];
//                         count++;
//                     }
//                     if (col > 0) {
//                         sum += v[ix(row, col-1)];
//                         count++;
//                     }
//                     if (col < width - 1) {
//                         sum += v[ix(row, col+1)];
//                         count++;
//                     }
//                     result[i] -= sum / count; //here is the smoothing part!!!!
//                 }
//             }
//             return pad(result);
//         }
//         function c(vec) {
//             var result = new Float64Array(opts.constraints.length);
//             for (var i=0; i<opts.constraints.length; ++i) {
//                 var c = opts.constraints[i];
//                 var y = c.y;
//                 var x = c.x;
//                 var row = Math.floor(y), rowNext = row + 1,
//                     col = Math.floor(x), colNext = col + 1,
//                     u = x - col, v = y - row;
//                 // xTop = (1-u) * vec[row,   col] + u * vec[row, col+1]
//                 // xBot = (1-u) * vec[row+1, col] + u * vec[row+1, col+1]
//                 // v = (1-v) * xTop + v * xBot
//                 //
//                 // inner products of rows
//                 var xTop  = (1-u) * vec[ix(row,   col)] + u * vec[ix(row,   col+1)];
//                 var xBot  = (1-u) * vec[ix(row+1, col)] + u * vec[ix(row+1, col+1)];
//                 result[i] = (1-v) * xTop + v * xBot;
//             }
//             return result;
//         }
//         function ct(vec) {
//             var result = create();
//             for (var i=0; i<opts.constraints.length; ++i) {
//                 var c = opts.constraints[i];
//                 var y = c.y;
//                 var x = c.x;
//                 var row = Math.floor(y), rowNext = row + 1,
//                     col = Math.floor(x), colNext = col + 1,
//                     u = x - col, v = y - row;
//                 // xTop = (1-u) * vec[row,   col] + u * vec[row, col+1]
//                 // xBot = (1-u) * vec[row+1, col] + u * vec[row+1, col+1]
//                 // v = (1-v) * xTop + v * xBot
//                 //
//                 // linear combinations of columns:
//                 result[ix(row, col)]     += vec[i] * (1-u) * (1-v);
//                 result[ix(row+1, col)]   += vec[i] * (1-u) * (v);
//                 result[ix(row, col+1)]   += vec[i] * (u)   * (1-v);
//                 result[ix(row+1, col+1)] += vec[i] * (u)   * (v);
//             }
//             return pad(result);
//         }

//         function applyATA(v) {
//             var ltlv = lx(lx(v));
//             var ctcv = ct(c(v));
//             var result = create();
//             for (var row=0; row<height; ++row) {
//                 for (var col=0; col<width; ++col) {
//                     var i = ix(row, col);
//                     result[i] = ltlv[i] * opts.smooth + ctcv[i] * (1 - opts.smooth);
//                 }
//             }
//             return pad(result);
//         }

//         // minimal required dumb implementation of level-1 blas
//         function daxpy(y, a, x) {
//             for (var i=0; i<y.length; ++i)
//                 y[i] += a * x[i];
//             return y;
//         }
//         function dscal(y, a) {
//             for (var i=0; i<y.length; ++i)
//                 y[i] = a * y[i];
//             return y;
//         }
//         function ddot(v1, v2) {
//             var result = 0;
//             for (var row=0; row<height; ++row) {
//                 for (var col=0; col<width; ++col) {
//                     var i = ix(row, col);
//                     result += v1[i] * v2[i];
//                 }
//             }
//             // for (var i=0; i<v1.length; ++i)
//             //     result += v1[i] * v2[i];
//             return result;
//         }

//         // A^T = [L c^T]
//         // since we'll always be solving systems of the shape
//         // Ax = b, where b = [0; constraintValues]
//         // and since we only need A^T x as an operation for computing AT^b,
//         // then we do not actually need to anything but the constraint values here.
//         function applyAT(constraintValues) {
//             var ctv = ct(constraintValues);
//             return pad(ctv);
//         }
//         function conjugateGradients(constraintValues, guess) {
//             var x_next, r_next, beta_next, d_next, r_next_l2;
//             var b = applyAT(constraintValues);
//             if (typeof (guess) === "undefined") {
//                 guess = create();
//             }
//             // d_0, r_0, a_0, x_0
//             var x_i = guess;
//             var Ax_i = applyATA(x_i);
//             var d_i = dscal(create(b), 1 - opts.smooth);
//             daxpy(d_i, -1, Ax_i);
//             var r_i = d_i;
//             var r_i_l2 = ddot(r_i, r_i);
//             if (r_i_l2 === 0)
//                 return x_i;

//             // FIXME adaptive number of steps, diagonal preconditioning
//             for (var i=0; i<100; ++i) { //May need to change to a large value
//                 var Ad_i = applyATA(d_i);
//                 var alpha_i = r_i_l2 / ddot(d_i, Ad_i);

//                 x_next = daxpy(create(x_i), alpha_i, d_i);
//                 r_next = daxpy(create(r_i), -alpha_i, Ad_i);
//                 r_next_l2 = ddot(r_next, r_next);
//                 beta_next = r_next_l2 / r_i_l2;
//                 d_next = daxpy(create(r_next), beta_next, d_i);

//                 if (r_next_l2 === 0) // IF ERROR IS ZERO.
//                     return x_next;
//                 x_i = x_next;
//                 r_i = r_next;
//                 d_i = d_next;
//                 r_i_l2 = r_next_l2;
//             }
//             return x_i;
//         }

//         return {
//             solve: conjugateGradients
//         };
//     }
// }

