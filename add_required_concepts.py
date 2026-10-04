import sqlite3


connection = sqlite3.connect("missionlms.db")

connection.execute(
    "ALTER TABLE assignments "
    "ADD COLUMN required_concepts TEXT NOT NULL DEFAULT ''"
)

connection.commit()
connection.close()

print("required_concepts added")