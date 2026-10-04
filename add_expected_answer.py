import sqlite3


connection = sqlite3.connect("missionlms.db")


connection.execute(
    "ALTER TABLE assignments "
    "ADD COLUMN expected_answer TEXT NOT NULL DEFAULT ''"
)


connection.commit()
connection.close()


print("expected_answer added")