const advisors = [
  {
    name: "WendyLuu",
    email: "wendylu@gamil.com",
  },
  {
    name: "zak",
    email: "zak@gmail.com",
  },
  {
    name: "Advisor Three",
    email: "advisor3@test.com",
  },
  {
    name: "Advisor Four",
    email: "advisor4@test.com",
  },
];

const students = [
  {
    name: "Ayla",
    email: "Ayla@gmail.com",
    courses: [
      { title: "Introducation to Academic Writing", code: "ENG101", grade: "B", term: "3/2023" },
      { title: "Information Assurance and Security I", code: "ITE420", grade: "A", term: "3/2024" },
      { title: "Business Culture and Current Issues in ASEAN", code: "SOC221", grade: "W", term: "3/2023" },
      { title: "Discrete Mathematics Structure", code: "ITE102", grade: "D+", term: "1/2025" },
      { title: "Intoduction to Data Science", code: "BSC224", grade: "B", term: "3/2025" },
      { title: "Software Testing and Maintenance", code: "CSC368", grade: "A", term: "3/2025" },
      { title: "Elementary Thai I", code: "THA101", grade: "IP", term: "1/2026" },
      { title: "System Administration and Maintenance", code: "ITE231", grade: "A", term: "2/2025" },
      { title: "Web Developmenet II", code: "CSC220", grade: "IP", term: "1/2026" },
      { title: "Human Computer Interaction", code: "ITE254", grade: "A", term: "1/2025" },
    ],
  },

  {
    name: "Nikolai",
    email: "niko@gmail.com",
    courses: [
      { title: "Database Managment Systems I", code: "ITE441", grade: "A", term: "2/2024" },
      { title: "General Psychology", code: "PSY101", grade: "B", term: "1/2024" },
      { title: "Operating Systems", code: "ITE240", grade: "B+", term: "3/2023" },
      { title: "Introduction to Statistics", code: "STA101", grade: "A", term: "2/2024" },
      { title: "Discrete Mathematics Structure", code: "ITE102", grade: "C+", term: "3/2025" },
      { title: "Mobile Application Development", code: "ITE343", grade: "A", term: "2/2025" },
      { title: "College English III", code: "ENG103", grade: "C", term: "1/2024" },
      { title: "Network I", code: "ITE475", grade: "A", term: "3/2024" },
      { title: "Software Quality Management", code: "ITE365", grade: "A", term: "2/2025" },
      { title: "Web Development II", code: "CSC220", grade: "IP", term: "1/2026" },
    ],
  },

  {
    name: "Ronaldo",
    email: "ronaldo@gmail.com",
    courses: [
      { title: "Computer Applications", code: "MIS103", grade: "B", term: "2/2024" },
      { title: "Human Computer Interaction", code: "ITE254", grade: "A", term: "3/2024" },
      { title: "Introduction to 3D Modeling and Virtual Reality", code: "ITE331", grade: "A", term: "1/2024" },
      { title: "General Psychology", code: "PSY101", grade: "A", term: "1/2024" },
      { title: "College Algebra I", code: "MAT101", grade: "B+", term: "2/2024" },
      { title: "IT Planning and Project Management", code: "ITE479", grade: "B", term: "3/2024" },
      { title: "Discrete Mathematics Structures", code: "BSC102", grade: "D+", term: "1/2025" },
      { title: "Data Management", code: "CSC441", grade: "A", term: "1/2025" },
      { title: "Java Programming II", code: "CSC222", grade: "A", term: "2/2025" },
      { title: "Operating Systems and Maintenance", code: "CSC240", grade: "C", term: "3/2025" },
    ],
  },

  {
    name: "Captan",
    email: "rachaphonb@gmail.com",
    courses: [
      { title: "Computer Organization", code: "ITE104", grade: "A", term: "2/2025" },
      { title: "IT Planning and Project Management", code: "ITE479", grade: "A", term: "2/2023" },
      { title: "General Psychology", code: "PSY101", grade: "A", term: "1/2023" },
      { title: "System Administration and Maintenance", code: "ITE231", grade: "B+", term: "2/2023" },
      { title: "Operating Systems", code: "ITE240", grade: "B", term: "3/2023" },
      { title: "Network I", code: "ITE475", grade: "B", term: "3/2023" },
      { title: "Web Development I", code: "ITE120", grade: "A", term: "1/2024" },
      { title: "Programming I", code: "ITE221", grade: "B+", term: "2/2024" },
      { title: "Programming II", code: "ITE222", grade: "A", term: "3/2024" },
      { title: "Software Quality Management", code: "ITE365", grade: "A", term: "2/2025" },
    ],
  },

  {
    name: "Bobby",
    email: "bobB@gmail.com",
    courses: [
      { title: "College English III", code: "ENG103", grade: "B", term: "3/2023" },
      { title: "Programming II", code: "ITE222", grade: "A", term: "3/2024" },
      { title: "Web Development I", code: "ITE120", grade: "A", term: "1/2025" },
      { title: "Computer Organization", code: "ITE104", grade: "A", term: "2/2024" },
      { title: "World Geography", code: "GEO101", grade: "B", term: "1/2023" },
      { title: "Introduction to Data Science", code: "ITE224", grade: "A", term: "3/2025" },
      { title: "Software Testing and Maintenance", code: "ITE368", grade: "A", term: "3/2025" },
      { title: "Mobile Application Development", code: "ITE343", grade: "A", term: "2/2025" },
      { title: "Network I", code: "ITE475", grade: "B", term: "3/2023" },
      { title: "Quantitative Methods for Business", code: "MAT102", grade: "A", term: "1/2024" },
    ],
  },

  {
    name: "Cucumber",
    email: "cucu@gmail.com",
    courses: [
      { title: "Academic Writing", code: "ENG102", grade: "A", term: "2/2023" },
      { title: "Social and Professional Issues in Information Technology", code: "ITE210", grade: "C", term: "2/2023" },
      { title: "Computer Applications", code: "MIS103", grade: "A", term: "2/2023" },
      { title: "Developmental Psychology", code: "PSY202", grade: "B+", term: "2/2023" },
      { title: "College English III", code: "ENG103", grade: "B", term: "3/2023" },
      { title: "Human-Computer Interaction", code: "ITE254", grade: "B+", term: "3/2023" },
      { title: "IT Planning and Project Management", code: "ITE479", grade: "A", term: "3/2023" },
      { title: "College of Algebra I", code: "MAT101", grade: "A", term: "3/2023" },
      { title: "Introduction to 3D Modeling and Virtual Reality", code: "ITE331", grade: "A", term: "1/2024" },
      { title: "Introduction to Statistics", code: "STA101", grade: "A", term: "1/2024" },
    ],
  },

  {
    name: "Demon",
    email: "Demon@gmail.com",
    courses: [
      { title: "Academic Writing", code: "ENG102", grade: "A", term: "3/2023" },
      { title: "Information Assurance and Security I", code: "ITE420", grade: "A", term: "3/2024" },
      { title: "Web Development I", code: "ITE120", grade: "A", term: "1/2024" },
      { title: "Computer Organization", code: "ITE104", grade: "A", term: "1/2024" },
      { title: "College English III", code: "ENG103", grade: "A", term: "2/2024" },
      { title: "IT Planning and Project Management", code: "ITE479", grade: "A", term: "3/2024" },
      { title: "Discrete Mathematics Structures", code: "BSC102", grade: "B", term: "3/2024" },
      { title: "Programming I", code: "ITE221", grade: "A", term: "3/2024" },
      { title: "Programming II", code: "ITE222", grade: "A", term: "1/2025" },
      { title: "Network I", code: "ITE475", grade: "A", term: "2/2025" },
    ],
  },

  {
    name: "Kappaboy",
    email: "kappy@gmail.com",
    courses: [
      { title: "Quantitative Methods for Business", code: "MAT102", grade: "A", term: "2/2024" },
      { title: "Introduction to Academic Writing", code: "ENG101", grade: "D+", term: "1/2024" },
      { title: "Programming II", code: "ITE222", grade: "A", term: "2/2025" },
      { title: "Computer Organization", code: "ITE104", grade: "B+", term: "2/2025" },
      { title: "Introduction to Data Science", code: "ITE224", grade: "A", term: "3/2025" },
      { title: "Discrete Mathematics Structure", code: "ITE102", grade: "C+", term: "3/2025" },
      { title: "Human Computer Interaction", code: "ITE254", grade: "B", term: "3/2025" },
      { title: "Software Testing and Maintenance", code: "ITE368", grade: "A", term: "3/2025" },
      { title: "Information Assurance and Security I", code: "ITE420", grade: "A", term: "2/2025" },
      { title: "Database Management Systems II", code: "ITE442", grade: "A", term: "2/2025" },
    ],
  },

  {
    name: "Zane",
    email: "zane@gmail.com",
    courses: [
      { title: "IT PLANNING AND PROJECT MANAGEMENT", code: "ITE479", grade: "A", term: "3/2023" },
      { title: "Web Development I", code: "ITE 120", grade: "A", term: "1/2024" },
      { title: "Thai History and Culture", code: "HIS101", grade: "B+", term: "2/2023" },
      { title: "Programming I", code: "ITE221", grade: "A", term: "2/2024" },
      { title: "Operating Systems", code: "ITE240", grade: "A", term: "3/2024" },
      { title: "Network I", code: "ITE475", grade: "A", term: "3/2024" },
      { title: "Programming II", code: "ITE222", grade: "A", term: "3/2024" },
      { title: "Introduction to Data Science", code: "ITE224", grade: "A", term: "1/2025" },
      { title: "SYSTEM ADMINISTRATION AND MAINTENANCE", code: "ITE231", grade: "A", term: "2/2025" },
      { title: "AWS CLOUD FOUNDATIONS", code: "ITE451", grade: "A", term: "3/2025" },
    ],
  },

  {
    name: "Alex",
    email: "alex@gmail.com",
    courses: [
      { title: "Information Technology Fundamentals", code: "ITE101", grade: "A", term: "3/2025" },
      { title: "AWS Cloud Foundations", code: "ITE451", grade: "A", term: "3/2025" },
      { title: "Machine Learning Foundation", code: "ITE353", grade: "A", term: "2/2025" },
      { title: "System Analysis, Design and Implementation", code: "ITE321", grade: "A", term: "1/2025" },
      { title: "Computer Organization", code: "ITE104", grade: "A", term: "2/2025" },
      { title: "Human Computer Interaction", code: "ITE254", grade: "A", term: "3/2023" },
      { title: "Information Assurance and Security I", code: "ITE420", grade: "A", term: "1/2024" },
      { title: "IT Service Desk & Incident Management", code: "ITE201", grade: "A", term: "2/2024" },
      { title: "Programming I", code: "ITE221", grade: "A", term: "2/2024" },
      { title: "Introduction to Data Science", code: "ITE224", grade: "A", term: "2/2024" },
    ],
  },

  {
    name: "Bay",
    email: "Bay@gmail.com",
    courses: [
      { title: "Social and Professional Issues in Information Technology", code: "ITE201", grade: "B", term: "2/2023" },
      { title: "AWS Cloud Foundations", code: "ITE451", grade: "B+", term: "3/2024" },
      { title: "Introduction to 3D Modeling and Virtual Reality", code: "ITE331", grade: "A", term: "3/2025" },
      { title: "Mobile Application Development", code: "ITE343", grade: "A", term: "2/2025" },
      { title: "Computer Organization", code: "ITE104", grade: "A", term: "2/2025" },
      { title: "Information Assurance and Security II", code: "ITE421", grade: "B+", term: "1/2025" },
      { title: "Introduction to Internet of Things", code: "ITE233", grade: "A", term: "1/2025" },
      { title: "Programming II", code: "ITE222", grade: "A", term: "3/2024" },
      { title: "Database Management Systems II", code: "ITE442", grade: "B+", term: "3/2024" },
      { title: "Information Technology Fundamentals", code: "ITE101", grade: "A", term: "2/2024" },
    ],
  },

  {
    name: "Elysia",
    email: "abc123@gmail.com",
    courses: [
      { title: "Computer Applications", code: "MIS103", grade: "A", term: "3/2024" },
      { title: "Academic Writing", code: "ENG102", grade: "A", term: "3/2024" },
      { title: "Discrete Mathematics", code: "BSC102", grade: "A", term: "3/2025" },
      { title: "Web Development1", code: "BSC120", grade: "A", term: "3/2025" },
      { title: "Human Computer Interaction", code: "BSC254", grade: "A", term: "3/2025" },
      { title: "Introduction to Statistics", code: "STA101", grade: "A", term: "3/2025" },
      { title: "Information Technology Fundamentals", code: "ITE101", grade: "A", term: "1/2025" },
      { title: "System Analysis Design And Implementation", code: "BSC321", grade: "IP", term: "1/2026" },
      { title: "College English3", code: "ENG103", grade: "IP", term: "1/2026" },
      { title: "Web Developmenet II", code: "CSC220", grade: "IP", term: "1/2026" },
    ],
  },

  {
    name: "Maxim",
    email: "irf@mail.ru",
    courses: [
      { title: "Network 2", code: "ITE476", grade: "B", term: "3/2025" },
      { title: "Introduction to Internet of Things", code: "ITE233", grade: "A", term: "2/2025" },
      { title: "DataBase managment Systems", code: "ITE441", grade: "C", term: "1/2025" },
      { title: "DataBase managment Systems 2", code: "ITE442", grade: "B+", term: "3/2024" },
      { title: "Programming", code: "ITE221", grade: "A", term: "3/2024" },
      { title: "Programming 2", code: "ITE222", grade: "A", term: "3/2025" },
      { title: "Human Computer Interaction", code: "ITE254", grade: "B", term: "2/2025" },
      { title: "Window Server", code: "ITE477", grade: "B+", term: "2/2025" },
      { title: "Introduction to Economics", code: "ECO200", grade: "B", term: "2/2025" },
      { title: "Computer Organization", code: "ITE104", grade: "B", term: "2/2025" },
    ],
  },

  {
    name: "Elara",
    email: "elara@gmail.com",
    courses: [
      { title: "Database Managment Systems I", code: "ITE 441", grade: "A", term: "2/2024" },
      { title: "Academic Writing", code: "ENG 102", grade: "B", term: "2/2024" },
      { title: "DataBase managment Systems II", code: "ITE 442", grade: "A", term: "3/2024" },
      { title: "Collage English III", code: "ENG 103", grade: "B+", term: "3/2024" },
      { title: "Web Development I", code: "ITE 120", grade: "A", term: "1/2025" },
      { title: "Programming 1", code: "ITE 221", grade: "A", term: "1/2025" },
      { title: "Programming II", code: "CSC 222", grade: "A", term: "2/2025" },
      { title: "Software Planning and Project Management", code: "BSC 479", grade: "A", term: "2/2025" },
      { title: "Machine Learning Foundation", code: "CSC 353", grade: "A", term: "2/2025" },
      { title: "Software Testing and Maintence", code: "CSC 368", grade: "A", term: "3/2025" },
    ],
  },

  {
    name: "Peter",
    email: "Peter@gmail.com",
    courses: [
      { title: "College English III", code: "ENG103", grade: "A", term: "2/2024" },
      { title: "Web Development I", code: "ITE120", grade: "A", term: "2/2024" },
      { title: "DataBase managment Systems", code: "ITE441", grade: "A", term: "1/2025" },
      { title: "Developmental Psychology", code: "PSY202", grade: "B+", term: "2/2025" },
      { title: "Programming", code: "ITE221", grade: "A", term: "3/2024" },
      { title: "Programming 2", code: "ITE222", grade: "A", term: "1/2025" },
      { title: "Software Testing and Maintenance", code: "ITE368", grade: "A", term: "3/2024" },
      { title: "Mobile Application Development", code: "ITE343", grade: "B+", term: "2/2025" },
      { title: "Quantitative Methods for Business", code: "MAT102", grade: "B+", term: "1/2025" },
      { title: "Introduction to Statistics", code: "STA101", grade: "B+", term: "3/2025" },
    ],
  },

  {
    name: "Bernardo",
    email: "Bernardo@gmail.com",
    courses: [
      { title: "Web Development II", code: "ITE220", grade: "A", term: "2/2025" },
      { title: "Academic Writing", code: "ENG 103", grade: "A", term: "2//2025" },
      { title: "Programming 2", code: "ITE222", grade: "A", term: "1/2025" },
      { title: "World Geography", code: "GEO101", grade: "A", term: "1/2025" },
      { title: "Information Assurance and Security II", code: "ITE421", grade: "B", term: "3/2025" },
      { title: "Database Management Systems II", code: "ITE442", grade: "A", term: "3/2025" },
      { title: "Operating Systems", code: "ITE420", grade: "A", term: "3/2026" },
      { title: "Software Testing and Maintenance", code: "ITE368", grade: "A", term: "1/2026" },
      { title: "Network I", code: "ITE475", grade: "A", term: "3/2026" },
      { title: "Software Quality Management", code: "ITE365", grade: "A", term: "2/2026" },
    ],
  },

  {
    name: "Zinn",
    email: "Zinn@gmail.com",
    courses: [
      { title: "Network I", code: "ITE475", grade: "A", term: "3/1" },
      { title: "Web Development II", code: "ITE220", grade: "B", term: "3/2024" },
      { title: "System Analysis", code: "ITE321", grade: "B", term: "3/2024" },
      { title: "Computer Organization", code: "ITE104", grade: "B", term: "3/2024" },
      { title: "Operating System", code: "ITE240", grade: "A", term: "3/2024" },
      { title: "Database Management Systems II", code: "ITE442", grade: "A", term: "3/3024" },
      { title: "Software Testing and Maintenance", code: "ITE368", grade: "B", term: "3/2024" },
      { title: "College of Algebra I", code: "MAT101", grade: "A", term: "3/2024" },
      { title: "Programming !", code: "ITE222", grade: "A", term: "3/2024" },
      { title: "Software Quality Management", code: "ITE365", grade: "B", term: "3/2024" },
    ],
  },

  {
    name: "helloworld",
    email: "helloworld@gmail.com",
    courses: [
      { title: "Web Development I", code: "ITE120", grade: "A", term: "1/2025" },
    ],
  },

  // Extra fake students added to reach 25 students

  {
    name: "Liam Stone",
    email: "liam.stone@test.com",
    courses: [
      { title: "Web Development I", code: "ITE120", grade: "B+", term: "1/2025" },
      { title: "Programming I", code: "ITE221", grade: "A", term: "2/2025" },
      { title: "Operating Systems", code: "ITE240", grade: "C+", term: "3/2025" },
      { title: "Web Development II", code: "CSC220", grade: "IP", term: "1/2026" },
    ],
  },

  {
    name: "Mira Lane",
    email: "mira.lane@test.com",
    courses: [
      { title: "Academic Writing", code: "ENG102", grade: "B", term: "1/2025" },
      { title: "Computer Organization", code: "ITE104", grade: "A", term: "2/2025" },
      { title: "Programming II", code: "ITE222", grade: "B+", term: "3/2025" },
      { title: "Database Management Systems I", code: "ITE441", grade: "IP", term: "1/2026" },
    ],
  },

  {
    name: "Noah Reed",
    email: "noah.reed@test.com",
    courses: [
      { title: "Web Development I", code: "ITE120", grade: "F", term: "3/2025" },
      { title: "Programming I", code: "ITE221", grade: "B", term: "2/2025" },
      { title: "Computer Organization", code: "ITE104", grade: "C+", term: "1/2025" },
    ],
  },

  {
    name: "Sofia Hart",
    email: "sofia.hart@test.com",
    courses: [
      { title: "Web Development I", code: "ITE120", grade: "A", term: "1/2025" },
      { title: "Human Computer Interaction", code: "ITE254", grade: "A", term: "2/2025" },
      { title: "Database Management Systems I", code: "ITE441", grade: "B+", term: "3/2025" },
    ],
  },

  {
    name: "Ethan Cole",
    email: "ethan.cole@test.com",
    courses: [
      { title: "Programming I", code: "ITE221", grade: "B+", term: "1/2025" },
      { title: "Programming II", code: "ITE222", grade: "B", term: "2/2025" },
      { title: "Network I", code: "ITE475", grade: "W", term: "3/2025" },
      { title: "Network I", code: "ITE475", grade: "IP", term: "1/2026" },
    ],
  },

  {
    name: "Aria Quinn",
    email: "aria.quinn@test.com",
    courses: [
      { title: "Introduction to Statistics", code: "STA101", grade: "A", term: "1/2025" },
      { title: "Introduction to Data Science", code: "ITE224", grade: "B+", term: "2/2025" },
      { title: "Machine Learning Foundation", code: "ITE353", grade: "IP", term: "1/2026" },
    ],
  },

  {
    name: "Leo Grant",
    email: "leo.grant@test.com",
    courses: [
      { title: "Computer Organization", code: "ITE104", grade: "B", term: "1/2025" },
      { title: "Operating Systems", code: "ITE240", grade: "B+", term: "2/2025" },
      { title: "Software Testing and Maintenance", code: "ITE368", grade: "A", term: "3/2025" },
      { title: "Web Development II", code: "CSC220", grade: "IP", term: "1/2026" },
    ],
  },
];

module.exports = {
  advisors,
  students,
};