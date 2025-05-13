# EduGuardian Database Schema

This document outlines the MongoDB schema for the EduGuardian application.

## Collections

### 1. `User`

Stores information about registered users.

| Field                        | Type                                      | Description                                                                 | Required | Default         | Index | Notes                                                                 |
| ---------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- | -------- | --------------- | ----- | --------------------------------------------------------------------- |
| `_id`                        | `ObjectId`                                | Unique identifier for the user                                              | Yes      | (auto)          | Yes   | Primary key                                                           |
| `name`                       | `String`                                  | Full name of the user                                                       | Yes      |                 |       | Max 50 chars                                                          |
| `email`                      | `String`                                  | Email address of the user                                                   | Yes      |                 | Yes   | Unique, Valid email format                                            |
| `username`                   | `String`                                  | Unique username for the user                                                | Yes      |                 | Yes   | Unique, Max 20 chars                                                  |
| `role`                       | `String`                                  | User role (`user`, `publisher`, `admin`)                                    | Yes      | `user`          |       | Enum                                                                  |
| `password`                   | `String`                                  | Hashed password (selected false by default)                                 | Yes      |                 |       | Min 6 chars                                                           |
| `profileImage`               | `String`                                  | URL or path to the user's profile image                                     | No       | `no-photo.jpg`  |       |                                                                       |
| `biography`                  | `String`                                  | Short biography of the user                                                 | No       |                 |       | Max 500 chars                                                         |
| `preferences`                | `Object`                                  | User-specific preferences                                                   | No       | `{}`            |       |                                                                       |
| `preferences.darkMode`       | `Boolean`                                 | Whether dark mode is enabled                                                | No       | `false`         |       |                                                                       |
| `preferences.emailNotifications` | `Boolean`                             | Whether email notifications are enabled                                     | No       | `true`          |       |                                                                       |
| `xp`                         | `Number`                                  | Experience points earned by the user                                        | No       | `0`             |       |                                                                       |
| `level`                      | `Number`                                  | Current level of the user, derived from XP                                  | No       | `1`             |       |                                                                       |
| `streak`                     | `Object`                                  | User's login streak information                                             | No       | `{}`            |       |                                                                       |
| `streak.count`               | `Number`                                  | Current consecutive login days (legacy, see `currentStreak`)                | No       | `0`             |       |                                                                       |
| `streak.lastActive`          | `Date`                                    | Last date the user was active (legacy, see `currentStreak`)                 | No       | `Date.now`      |       |                                                                       |
| `badges`                     | `Array<Object>`                           | Array of badges earned by the user                                          | No       | `[]`            |       | Sub-document array                                                    |
| `badges[].badge`             | `ObjectId`                                | Reference to the `Badge` collection (`Badge._id`)                           | Yes      |                 |       | Foreign Key to `Badge`                                                |
| `badges[].earnedAt`          | `Date`                                    | Date when the badge was earned                                              | No       | `Date.now`      |       |                                                                       |
| `currentStreak`              | `Number`                                  | Current consecutive days the user has been active                           | No       | `0`             |       |                                                                       |
| `longestStreak`              | `Number`                                  | Longest consecutive streak achieved by the user                             | No       | `0`             |       |                                                                       |
| `activity`                   | `Array<Object>`                           | Log of user activities                                                      | No       | `[]`            |       | Sub-document array                                                    |
| `activity[].action`          | `String`                                  | Type of action performed (e.g., `upload`, `login`, `earn_badge`)            | Yes      |                 |       | Enum                                                                  |
| `activity[].description`     | `String`                                  | Optional description of the activity                                        | No       |                 |       |                                                                       |
| `activity[].xpEarned`        | `Number`                                  | XP earned for this activity                                                 | No       | `0`             |       |                                                                       |
| `activity[].createdAt`       | `Date`                                    | Timestamp of the activity                                                   | No       | `Date.now`      |       |                                                                       |
| `subjects`                   | `Array<Object>`                           | User's progress in different subjects                                       | No       | `[]`            |       | Sub-document array                                                    |
| `subjects[].name`            | `String`                                  | Name of the subject                                                         | No       |                 |       |                                                                       |
| `subjects[].progress`        | `Number`                                  | Progress percentage (0-100)                                                 | No       | `0`             |       | Min 0, Max 100                                                        |
| `resetPasswordToken`         | `String`                                  | Token for resetting password                                                | No       |                 |       |                                                                       |
| `resetPasswordExpire`        | `Date`                                    | Expiry date for the reset password token                                    | No       |                 |       |                                                                       |
| `emailVerificationToken`     | `String`                                  | Token for verifying email address                                           | No       |                 |       |                                                                       |
| `emailVerificationTokenExpire` | `Date`                                  | Expiry date for the email verification token                                | No       |                 |       |                                                                       |
| `emailVerified`              | `Boolean`                                 | Whether the user's email has been verified                                  | No       | `false`         |       |                                                                       |
| `aiUsage`                    | `Object`                                  | Tracks AI feature usage for quotas                                          | No       | `{}`            |       |                                                                       |
| `aiUsage.summaryCount`       | `Number`                                  | Number of AI summaries generated                                            | No       | `0`             |       |                                                                       |
| `aiUsage.flashcardCount`     | `Number`                                  | Number of AI flashcard sets generated                                       | No       | `0`             |       |                                                                       |
| `aiUsage.lastReset`          | `Date`                                    | Date when AI usage quotas were last reset                                   | No       | `Date.now`      |       |                                                                       |
| `createdAt`                  | `Date`                                    | Timestamp of user creation                                                  | No       | `Date.now`      | Yes   | Managed by Mongoose (or default)                                      |
| `updatedAt`                  | `Date`                                    | Timestamp of last user update                                               | No       |                 |       | Managed by Mongoose `timestamps: true`                                |

**Key Indexes on User:**
* `email: 1` (unique)
* `username: 1` (unique)
* `createdAt: 1` (if not using `timestamps: true` explicitly for this)

---

### 2. `Note`

Stores information about study notes uploaded by users.

| Field             | Type                                                                                                | Description                                                              | Required | Default      | Index | Notes                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------- | ------------ | ----- | ------------------------------------------------------------------------------ |
| `_id`             | `ObjectId`                                                                                          | Unique identifier for the note                                           | Yes      | (auto)       | Yes   | Primary key                                                                    |
| `title`           | `String`                                                                                            | Title of the note                                                        | Yes      |              | Yes   | Max 100 chars. Indexed with `user` for uniqueness per user. Text indexed.    |
| `slug`            | `String`                                                                                            | URL-friendly slug generated from the title                               | No       |              | Yes   | Auto-generated                                                                 |
| `description`     | `String`                                                                                            | Optional description of the note                                         | No       |              |       | Max 500 chars. Text indexed.                                                   |
| `fileUrl`         | `String`                                                                                            | URL of the uploaded note file (e.g., Cloudinary URL)                     | Yes      |              |       |                                                                                |
| `fileType`        | `String`                                                                                            | Type of the file (e.g., `pdf`, `docx`, `png`)                            | Yes      | `unknown`    |       | Enum                                                                           |
| `fileSize`        | `Number`                                                                                            | Size of the file in bytes                                                | Yes      |              |       |                                                                                |
| `subject`         | `String`                                                                                            | Academic subject of the note                                             | Yes      |              | Yes   | Enum. Part of compound index.                                                  |
| `grade`           | `String`                                                                                            | Grade level for the note (`11`, `12`)                                    | Yes      |              | Yes   | Enum. Part of compound index.                                                  |
| `semester`        | `String`                                                                                            | Semester for the note (`1`, `2`)                                         | Yes      |              | Yes   | Enum. Part of compound index.                                                  |
| `quarter`         | `String`                                                                                            | Quarter for the note (`1`, `2`, `3`, `4`)                                | Yes      |              | Yes   | Enum. Part of compound index.                                                  |
| `topic`           | `String`                                                                                            | Specific topic of the note                                               | Yes      |              |       | Text indexed.                                                                  |
| `publicId`        | `String`                                                                                            | Public ID from Cloudinary (or other asset manager)                       | No       |              |       |                                                                                |
| `assetId`         | `String`                                                                                            | Asset ID from Cloudinary (or other asset manager)                        | No       |              |       |                                                                                |
| `tags`            | `Array<String>`                                                                                     | Array of tags associated with the note                                   | No       | `[]`         |       | Text indexed.                                                                  |
| `viewCount`       | `Number`                                                                                            | Number of times the note has been viewed                                 | No       | `0`          |       |                                                                                |
| `downloadCount`   | `Number`                                                                                            | Number of times the note has been downloaded                             | No       | `0`          |       |                                                                                |
| `ratings`         | `Array<Object>`                                                                                     | Array of ratings given by users                                          | No       | `[]`         |       | Sub-document array                                                             |
| `ratings[].value` | `Number`                                                                                            | Rating value (1-5)                                                       | Yes      |              |       | Min 1, Max 5                                                                   |
| `ratings[].user`  | `ObjectId`                                                                                          | Reference to the `User` who gave the rating (`User._id`)                 | Yes      |              |       | Foreign Key to `User`                                                          |
| `averageRating`   | `Number`                                                                                            | Calculated average rating of the note                                    | No       | `0`          | Yes   | Auto-calculated                                                                |
| `aiSummary`       | `String`                                                                                            | AI-generated summary of the note                                         | No       |              |       | Max 2000 chars                                                                 |
| `flashcards`      | `Array<Object>`                                                                                     | Array of flashcards created for the note                                 | No       | `[]`         |       | Sub-document array                                                             |
| `flashcards[].question` | `String`                                                                                      | Question for the flashcard                                               | Yes      |              |       |                                                                                |
| `flashcards[].answer`   | `String`                                                                                      | Answer for the flashcard                                                 | Yes      |              |       |                                                                                |
| `flashcards[].difficulty`| `String`                                                                                    | Difficulty of the flashcard (`easy`, `medium`, `hard`)                   | No       | `medium`     |       | Enum                                                                           |
| `user`            | `ObjectId`                                                                                          | Reference to the `User` who uploaded the note (`User._id`)               | Yes      |              | Yes   | Foreign Key to `User`                                                          |
| `isPublic`        | `Boolean`                                                                                           | Whether the note is publicly accessible                                  | No       | `true`       |       |                                                                                |
| `createdAt`       | `Date`                                                                                              | Timestamp of note creation                                               | No       |              | Yes   | Managed by Mongoose `timestamps: true`                                         |
| `updatedAt`       | `Date`                                                                                              | Timestamp of last note update                                            | No       |              |       | Managed by Mongoose `timestamps: true`                                         |

**Key Indexes on Note:**
* `subject: 1, grade: 1, semester: 1, quarter: 1` (compound)
* `title: 'text', description: 'text', topic: 'text', tags: 'text'` (text index for search)
* `slug: 1`
* `user: 1`
* `title: 1, user: 1` (unique compound index)
* `averageRating: -1`
* `createdAt: -1`

---

### 3. `Badge`

Stores definitions for badges that users can earn.

| Field           | Type                                                      | Description                                                        | Required | Default     | Index | Notes                                                                    |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------------------ | -------- | ----------- | ----- | ------------------------------------------------------------------------ |
| `_id`           | `ObjectId`                                                | Unique identifier for the badge                                    | Yes      | (auto)      | Yes   | Primary key                                                              |
| `name`          | `String`                                                  | Name of the badge                                                  | Yes      |             | Yes   | Unique, Max 50 chars                                                     |
| `description`   | `String`                                                  | Description of the badge and its criteria                          | Yes      |             |       | Max 200 chars                                                            |
| `icon`          | `String`                                                  | URL or path to the badge icon                                      | Yes      |             |       |                                                                          |
| `category`      | `String`                                                  | Category of the badge (`upload`, `engagement`, `streak`, `achievement`, `special`) | Yes      |             | Yes   | Enum. Part of compound index.                                            |
| `requirements`  | `Mixed`                                                   | Object defining the criteria for earning the badge                 | Yes      |             |       | Flexible structure (e.g., `{ type: 'login_streak', value: 3 }`)          |
| `xpReward`      | `Number`                                                  | XP awarded upon earning this badge                                 | No       | `0`         |       |                                                                          |
| `rarity`        | `String`                                                  | Rarity of the badge (`common`, `uncommon`, `rare`, `epic`, `legendary`) | No       | `common`    | Yes   | Enum. Part of compound index.                                            |
| `isActive`      | `Boolean`                                                 | Whether the badge is currently active and can be earned            | No       | `true`      |       |                                                                          |
| `displayOrder`  | `Number`                                                  | Order in which to display the badge                                | No       | `999`       |       |                                                                          |
| `slug`          | `String`                                                  | URL-friendly slug generated from the name                          | No       |             |       | Auto-generated                                                           |
| `createdAt`     | `Date`                                                    | Timestamp of badge definition creation                             | No       | `Date.now`  |       |                                                                          |

**Key Indexes on Badge:**
* `name: 1` (unique)
* `category: 1, rarity: 1` (compound)

---

## Relationships

*   **User to Note (One-to-Many):** A user can have many notes (`Note.user` references `User._id`).
*   **User to Badge (Many-to-Many through User.badges):** A user can earn many badges, and a badge can be earned by many users. The `User.badges` array stores `ObjectId` references to the `Badge` collection.
*   **Note to User (Many-to-One for Ratings):** A note can have ratings from many users (`Note.ratings[].user` references `User._id`).

## Normalization Notes

*   **User Badges:** `User.badges` stores an array of objects, each containing a reference (`ObjectId`) to a `Badge` document and the `earnedAt` timestamp. This avoids duplicating badge metadata (name, description, icon) within each user document, promoting normalization.
*   **Note Ratings:** `Note.ratings` stores an array of objects, each containing a reference (`ObjectId`) to a `User` document and the `value` of the rating. This avoids duplicating user details within each note's rating array.
*   Embedded data like `User.activity`, `User.preferences`, `Note.flashcards` are used for information tightly coupled with the parent entity and not typically queried independently or referenced by many other documents.

This schema aims for a balance between query efficiency, data integrity, and manageable complexity. 