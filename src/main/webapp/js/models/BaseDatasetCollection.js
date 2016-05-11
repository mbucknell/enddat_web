/* jslint browser: true */

define([
	'underscore',
	'backbone',
	'utils/dateUtils'
], function(_, Backbone, dateUtils) {

	/*
	 * @constructs - the collection contains models with startDate and endDate properties, both moment objects and a
	 * variables property which is BaseVariableCollection.
	 */
	var collection = Backbone.Collection.extend({

		/*
		 * @returns {Boolean} - ture if any of the models contain a variable that has been selected
		 */
		hasSelectedVariables : function() {
			return this.some(function(model) {
				return model.get('variables').hasSelectedVariables();
			});
		},

		/*
		 * The startDate and endDate values in each model are assumed to be moment objects
		 * @param {Moment} startDate
		 * @param {Moment} endDate
		 * @returns {Array of Backbone.Model} whose startDate and endDate range overlaps the function parameters.
		 *		If startDate or endDate are falsy, all of the models in the collection are returned.
		 */
		getSiteModelsWithinDateFilter : function(startDate, endDate) {
			var dateFilter;
			var result;

			if ((startDate) && (endDate)) {
				dateFilter = {
					start : startDate,
					end : endDate
				};
				result = this.filter(function(model) {
					return dateUtils.dateRangeOverlaps(model.attributes.variables.getDateRange(), dateFilter);
				});
			}
			else {
				result = this.toArray();
			}

			return result;
		},

		/*
		 * @returns {Array of Objects with name and value properties} -
		 *		 representing the URL parameters for the selected variables
		 */
		getSelectedVariablesUrlParams : function() {
			var params = [];
			params = this.map(function(siteModel)  {
				return siteModel.get('variables').getSelectedUrlParams(siteModel.attributes);
			});
			return _.flatten(params);
		}
	});

	return collection;
});


