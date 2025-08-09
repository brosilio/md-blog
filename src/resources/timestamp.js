require("dotenv").config();
const TIME_LOCALE = process.env.TIME_LOCALE || "en-US";
const timeFormat = {
	weekday: "long",
	month: "long",
	day: "numeric",
    year: "numeric"
};

function FormatFileTime(timestamp) {
	if (!timestamp) return "(no date)";

	timestamp = new Date(timestamp);

	let baseDate = timestamp.toLocaleDateString(TIME_LOCALE, timeFormat);

	const hour24 = timestamp.getHours();
	const minutes = timestamp.getMinutes();

	let hour = hour24 % 12 || 12;
	const isPM = hour24 >= 12;
	const suffix = isPM ? 'pm' : 'am';

	const roundedMins = Math.round(minutes / 30) * 30;
	const roundedHour = (roundedMins === 60) ? (hour % 12 || 12) + 1 : hour;
	const roundedSuffix = (roundedMins === 60) ? (hour === 11 ? !isPM : isPM) ? 'pm' : 'am' : suffix;

	const formatOptions = [
		`like ${roundedHour}${roundedMins === 30 ? `:30` : ''}${roundedSuffix}`,
		`around ${roundedHour}${roundedSuffix}`,
		`${roundedHour}${roundedSuffix}-ish`,
		`maybe ${roundedHour}${roundedSuffix}?`,
		`somewhere near ${roundedHour}${roundedSuffix}`,
		`uhhh ${roundedHour}${roundedSuffix} sorta`,
	];

	const fuzzyTime = formatOptions[Math.floor(Math.random() * formatOptions.length)];

	return `${baseDate}, ${fuzzyTime}`;
}

module.exports = {
	FormatFileTime,
};
