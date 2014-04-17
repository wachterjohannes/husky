(function() {

    'use strict';

    require.config({
        paths: {
            'globalize_lib': 'bower_components/globalize/lib/globalize',
            'cultures': 'bower_components/globalize/lib/cultures'
        }
    });

    define(['globalize_lib'], function() {
        return  {
            name: 'husky-validation',

            initialize: function(app) {
                app.sandbox.globalize = {
                    addCultureInfo: function(cultureName, messages) {
                        Globalize.addCultureInfo(cultureName, {
                            messages: messages
                        });
                    },

                    culture: function(cultureName) {
                        var setLanguage = function() {
                            Globalize.culture(cultureName);
                        };

                        if (cultureName !== 'en') {
                            require(['cultures/globalize.culture.' + cultureName], setLanguage.bind(this));
                        } else {
                            setLanguage();
                        }
                    }
                };

                app.sandbox.translate = function(key) {
                    if (!app.config.culture || !app.config.culture.name) {
                        return key;
                    }
                    var translation = Globalize.localize(key, app.config.culture.name);
                    return !!translation ? translation : key;
                };

                app.sandbox.date = {
                    /**
                     * returns formatted date string
                     * @param {string|Date} date
                     * @returns {string}
                     */
                    format: function(date) {
                        if(typeof date === 'string'){
                            date = this.parse(date);
                        }
                        return Globalize.format(date);
                    },

                    /**
                     * parse ISO8601 string : string -> Date
                     * Parse an ISO-8601 date, including possible timezone,
                     * into a Javascript Date object.
                     * (inspired by: http://stackoverflow.com/questions/439630/how-do-you-create-a-javascript-date-object-with-a-set-timezone-without-using-a-s)
                     *
                     * Test strings: parseISO8601String(x).toISOString()
                     * "2013-01-31T12:34"              -> "2013-01-31T12:34:00.000Z"
                     * "2013-01-31T12:34:56"           -> "2013-01-31T12:34:56.000Z"
                     * "2013-01-31T12:34:56.78"        -> "2013-01-31T12:34:56.780Z"
                     * "2013-01-31T12:34:56.78+0100"   -> "2013-01-31T11:34:56.780Z"
                     * "2013-01-31T12:34:56.78+0530"   -> "2013-01-31T07:04:56.780Z"
                     * "2013-01-31T12:34:56.78-0330"   -> "2013-01-31T16:04:56.780Z"
                     * "2013-01-31T12:34:56-0330"      -> "2013-01-31T16:04:56.000Z"
                     * "2013-01-31T12:34:56Z"          -> "2013-01-31T12:34:56.000Z"
                     *
                     * @param {string} dateString
                     * @returns {Date}
                     */
                    parse: function(dateString) {
                        var timebits = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?::([0-9]*)(\.[0-9]*)?)?(?:([+-])([0-9]{2})([0-9]{2}))?/,
                            m = timebits.exec(dateString),
                            resultDate;

                        if (m) {
                            var utcdate = Date.UTC(parseInt(m[1]),
                                parseInt(m[2]) - 1, // months are zero-offset (!)
                                parseInt(m[3]),
                                parseInt(m[4]), parseInt(m[5]), // hh:mm
                                (m[6] && parseInt(m[6]) || 0),  // optional seconds
                                (m[7] && parseFloat(m[7]) * 1000) || 0); // optional fraction
                            // utcdate is milliseconds since the epoch
                            if (m[9] && m[10]) {
                                var offsetMinutes = parseInt(m[9]) * 60 + parseInt(m[10]);
                                utcdate += (m[8] === '+' ? -1 : +1) * offsetMinutes * 60000;
                            }
                            resultDate = new Date(utcdate);
                        } else {
                            resultDate = null;
                        }
                        return resultDate;
                    }
                };

                /**
                 * function calls this.sandbox.translate for an array of keys and returns an array of translations
                 * @param array
                 * @returns {Array}
                 */
                app.sandbox.translateArray = function(array) {
                    var translations = [];
                    app.sandbox.util.foreach(array, function(key) {
                        translations.push(app.sandbox.translate(key));
                    }.bind(this));
                    return translations;
                };

                app.setLanguage = function(cultureName, messages) {
                    var setLanguage = function() {
                        Globalize.culture(cultureName);
                        app.sandbox.globalize.addCultureInfo(cultureName, messages);
                    };
                    if (cultureName !== 'en') {
                        require(['cultures/globalize.culture.' + cultureName], setLanguage.bind(this));
                    } else {
                        setLanguage();
                    }
                };
            },

            afterAppStart: function(app) {
                if (!!app.config.culture && !!app.config.culture) {
                    if (!app.config.culture.messages) {
                        app.config.culture.messages = { };
                    }
                    app.setLanguage(app.config.culture.name, app.config.culture.messages);
                }
            }
        };
    });
})();
