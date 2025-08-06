require("dotenv").config();
const TIME_LOCALE = process.env.TIME_LOCALE || "en-US";
const timeFormat = {
	weekday: "long",
	month: "long",
	day: "numeric",
};

function FormatFileTime(timestamp) {
	timestamp = new Date(timestamp);
	return timestamp
		? timestamp.toLocaleDateString(TIME_LOCALE, timeFormat)
		: "(no date)";
}

module.exports = {
	FormatFileTime,
};
