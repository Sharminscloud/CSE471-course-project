const axios = require("axios");

const checkHoliday = async (req, res) => {
  const { date, country = "BD" } = req.query;

  // 1. Make sure date is provided
  if (!date)
    return res.status(400).json({ message: "date is required (YYYY-MM-DD)" });

  try {
    // 2. Call the free holiday API (no key needed)
    const year = date.split("-")[0];
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
    const response = await axios.get(url);

    // 3. Check if the date is in the holiday list
    const found = response.data.find((h) => h.date === date);

    if (found) {
      // It's a holiday — block booking
      return res.json({
        date,
        isHoliday: true,
        bookingAllowed: false,
        holidayName: found.name,
        message: `Booking blocked. ${found.name} is a public holiday.`,
      });
    }

    // Not a holiday — allow booking
    res.json({
      date,
      isHoliday: false,
      bookingAllowed: true,
      message: "Date is available for booking.",
    });
  } catch (err) {
    // 4. API failed — block booking as safe fallback
    console.error("Holiday API error:", err.message);
    res.json({
      date,
      isHoliday: null,
      bookingAllowed: false,
      message: "Could not check holidays. Booking blocked for safety.",
    });
  }
};

module.exports = { checkHoliday };
