(function () {
    "use strict";

    // http://stackoverflow.com/questions/14047809/js-defineproperty-and-prototype
    var Mortgage = (function () {
        function Mortgage(amount, interestInPercent, repaymentInPercent) {
            // Define property for field values
            Object.defineProperty(this, "_", { value: {} });

            this._.amount = amount;
            this._.interestInPercent = interestInPercent;
            this._.repaymentInPercent = repaymentInPercent;

            this.computeSchedule();

            Object.seal(this);
        }

        /**
         * Recompute a new schedule.
         */
        Mortgage.prototype.computeSchedule = function () {
            this._.repaymentSchedule = [{
                index: 0,
                principal: this._.amount,
                repaymentComponent: 0,
                interestComponent: 0,
                payment: 0,
                additionalRepayment: 0
            }];
            this.recomputeScheduleFrom(0);
        };

        Mortgage.prototype.recomputeScheduleFrom = function (index) {
            var monthlyInterestRate = Math.pow((1 + 0.01 * this.interestInPercent), 1/12) - 1;

            // TODO do not delete dangling repayments, but just adjust them
            this._.repaymentSchedule = this._.repaymentSchedule.slice(0, index + 1);
            var prev = this._.repaymentSchedule[index];
            do {
                var currentPrincipal = prev.principal - prev.repaymentComponent - prev.additionalRepayment;
                var interestComponent = currentPrincipal * monthlyInterestRate;
                var repaymentComponent = Math.min(currentPrincipal, this.monthlyPayment - interestComponent);
                var additionalRepayment = 0;

                var current = {
                    index: prev.index + 1,
                    year: Math.floor(prev.index/12) + 1,
                    month: prev.index % 12 + 1,
                    principal: currentPrincipal,
                    payment: interestComponent + repaymentComponent,
                    interestComponent: interestComponent,
                    repaymentComponent: repaymentComponent,
                    additionalRepayment: additionalRepayment
                };

                this._.repaymentSchedule.push(current);

                prev = current;
            } while (prev.principal > 0);

            function sum(augend, addend) {
                return augend + addend;
            }

            this._.totalPayment =
                this._.repaymentSchedule
                    .map(function(e) { return e.payment })
                    .reduce(sum, 0);

            this._.totalInterest =
                this._.repaymentSchedule
                    .map(function(e) { return e.interestComponent })
                    .reduce(sum, 0);
        };

        function createReadOnlyPropertyDescriptorFor(propertyName, callback) {
            return {
                get: function () { return this._[propertyName]; },
                configurable: false
            };
        }

        function createObservablePropertyDescriptorFor(propertyName, callback) {
            return {
                get: function () { return this._[propertyName]; },
                set: function (newValue) {
                    this._[propertyName] = newValue;
                    callback.call(this);
                },
                configurable: false
            };
        }

        Object.defineProperty(Mortgage.prototype, "annualPayment", {
            get: function () { return this._.amount * 0.01 * (this._.interestInPercent + this._.repaymentInPercent); },
            configurable: false
        });

        Object.defineProperty(Mortgage.prototype, "monthlyPayment", {
            get: function () { return this.annualPayment / 12; },
            configurable: false
        });

        var descriptorsForReadOnlyProperties =
            ["totalPayment", "totalInterest", "repaymentSchedule"].reduce(
                function(props, propertyName) {
                    props[propertyName] =
                        createReadOnlyPropertyDescriptorFor(propertyName);
                    return props;
                }, {});

        Object.defineProperties(
            Mortgage.prototype,
            descriptorsForReadOnlyProperties);

        var descriptorsForObservableProperties =
            ["amount", "interestInPercent", "repaymentInPercent"].reduce(
                function(props, propertyName) {
                    props[propertyName] =
                        createObservablePropertyDescriptorFor(
                            propertyName,
                            Mortgage.prototype.computeSchedule);
                    return props;
                }, {});

        Object.defineProperties(
            Mortgage.prototype,
            descriptorsForObservableProperties);

        return Mortgage;
    }());


    var app = angular.module("FixedRateMortgageApp", ["nvd3ChartDirectives"]);

    app.controller("FixedRateMortgageController", function ($scope) {
        this.mortgage = new Mortgage(35000, 0, 7);

        // compute an repayment schedule
        this.recomputeGraph = function () {
            console.log("recomputeGraph");

            var principalValues = [];
            this.mortgage.repaymentSchedule.forEach(function (scheduleElement) {
                principalValues.push([scheduleElement.index, scheduleElement.principal]);
            });


            var repaymentValues = [];
            this.mortgage.repaymentSchedule.forEach(function (scheduleElement) {
                repaymentValues.push([scheduleElement.index, this.mortgage.amount - scheduleElement.principal]);
            }, this);

            var graphData = [
                {key: "Principal", values: principalValues},
                {key: "Repayment", values: repaymentValues}
            ];
            this.graphData = graphData;
        };

        this.recomputeGraph();

        $scope.graphDataTooltipContentFunction = function () {
            return function (key, x, y, e, graph) {
                return "Super New Tooltip" +
                    "<h1>" + key + "</h1>" +
                    "<p>" + y + " at " + x + "</p>";
            };
        };
    });
}());
