CREATE TABLE IF NOT EXISTS court_slot_interest (
  court_id INT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  interest_count INT NOT NULL DEFAULT 0 CHECK (interest_count >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (court_id, booking_date, start_time, end_time),
  CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_court_slot_interest_date
ON court_slot_interest (court_id, booking_date);
