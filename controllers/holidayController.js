const axios = require("axios");

const checkHoliday = async (req, res) => {
  const { date, country = "BD" } = req.query;

  if (!date) {
    return res.status(400).json({
      message: "date is required",
    });
  }

  try {
    const year = date.split("-")[0];
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;

    const response = await axios.get(url);

    const holiday = response.data.find((item) => item.date === date);

    if (holiday) {
      return res.json({
        date,
        isHoliday: true,
        bookingAllowed: false,
        holidayName: holiday.name,
        message: `Booking blocked. ${holiday.name} is a public holiday.`,
      });
    }

    res.json({
      date,
      isHoliday: false,
      bookingAllowed: true,
      holidayName: null,
      message: "Date is available for booking.",
    });
  } catch (err) {
    res.json({
      date,
      isHoliday: null,
      bookingAllowed: false,
      holidayName: null,
      message: "Could not check holiday API. Booking blocked for safety.",
    });
  }
};

module.exports = { checkHoliday };
