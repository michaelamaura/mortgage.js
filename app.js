(function () {
    "use strict";

    // http://stackoverflow.com/questions/14047809/js-defineproperty-and-prototype
    var Mortgage = (function () {
        function Mortgage(amount, interest, repayment) {
            // Define property for field values
            Object.defineProperty(this, "_", { value: {} });

            this._.amount = amount;
            this._.interest = interest;
            this._.repayment = repayment;

            this.computeSchedule();
        }

        Object.defineProperty(Mortgage.prototype, "payment", {
            get: function () { return 0.01 * this._.amount * (this._.interest + this._.repayment); }
        });

        Mortgage.prototype.computeSchedule = function () {
            this._.repaymentSchedule = [];

            this._.totalPayment = 0;
            this._.totalInterest = 0;

            var principal = this._.amount;
            var index = 0;
            while (principal > 0) {
                var interestComponent = 0.01 * principal * this.interest;
                var repaymentComponent = Math.min(principal, this.payment - interestComponent);
                var actualPayment = interestComponent + repaymentComponent;

                this._.repaymentSchedule.push({
                    index: index,
                    principal: principal,
                    payment: actualPayment,
                    interestComponent: interestComponent,
                    repaymentComponent: repaymentComponent
                });

                this._.totalPayment += actualPayment;
                this._.totalInterest += interestComponent;

                principal -= repaymentComponent;
                index += 1;
            }
        };

        var defineProperties = function (propertyNames, descriptorFunc) {
            propertyNames.forEach(function (propertyName) {
                Object.defineProperty(Mortgage.prototype, propertyName, descriptorFunc(propertyName));
            });
        };

        var readOnlyFields = ["totalPayment", "totalInterest", "repaymentSchedule"];
        defineProperties(readOnlyFields, function (propertyName) {
            return {
                get: function () { return this._[propertyName]; }
            };
        });

        var dataFields = ["amount", "interest", "repayment"];
        defineProperties(dataFields, function (propertyName) {
            return {
                get: function () { return this._[propertyName]; },
                set: function (newValue) {
                    this._[propertyName] = newValue;
                    this.computeSchedule();
                }
            };
        });

        return Mortgage;
    }());


    var app = angular.module("FixedRateMortgageApp", ["nvd3ChartDirectives"]);

    app.controller("FixedRateMortgageController", function ($scope) {
        this.mortgage = new Mortgage(35000, 0, 7);

        // compute an repayment schedule
        this.computeSchedule = function () {
            var values = [];
            this.mortgage.repaymentSchedule.forEach(function (scheduleElement) {
                values.push([scheduleElement.index, scheduleElement.principal]);
            });

            var graphData = [{key: "Principal", values: values}];
			this.graphData = graphData;
        };

        this.computeSchedule();

		$scope.graphDataTooltipContentFunction = function () {
			return function (key, x, y, e, graph) {
                return "Super New Tooltip" +
                    "<h1>" + key + "</h1>" +
                    "<p>" + y + " at " + x + "</p>";
            };
        };
    });
}());
