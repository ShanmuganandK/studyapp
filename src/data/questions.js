export const getQuestionsForTopic = (topicId) => {
    const questions = {
        'g1-t1-s1': [ // Big and Small
            {
                question: "Which animal is BIGGER?",
                options: ["Elephant 🐘", "Mouse 🐁", "Ant 🐜", "Bee 🐝"],
                correctAnswer: "Elephant 🐘"
            },
            {
                question: "Which object is SMALLER?",
                options: ["Car 🚗", "Bicycle 🚲", "Key 🔑", "Bus 🚌"],
                correctAnswer: "Key 🔑"
            },
            {
                question: "Choose the BIGGEST fruit:",
                options: ["Grape 🍇", "Watermelon 🍉", "Apple 🍎", "Orange 🍊"],
                correctAnswer: "Watermelon 🍉"
            }
        ],
        'g1-t1-s2': [ // Near and Far
            {
                question: "If you are at the park, which is NEAR you?",
                options: ["The Sun ☀️", "The Grass 🌱", "The Moon 🌙", "A Star ⭐"],
                correctAnswer: "The Grass 🌱"
            },
            {
                question: "Which is FAR away in the sky?",
                options: ["Bird 🐦", "Airplane ✈️", "Cloud ☁️", "Sun ☀️"],
                correctAnswer: "Sun ☀️"
            }
        ],
        'g1-t2-s1': [ // Identify 2D Shapes
            {
                question: "Which shape has 3 sides?",
                options: ["Square", "Circle", "Triangle", "Rectangle"],
                correctAnswer: "Triangle"
            },
            {
                question: "Which shape is round?",
                options: ["Triangle", "Square", "Circle", "Star"],
                correctAnswer: "Circle"
            },
            {
                question: "A square has how many sides?",
                options: ["2", "3", "4", "5"],
                correctAnswer: "4"
            }
        ],
        'g1-t1-s3': [ // Inside and Outside
            { question: "The dog is ___ the kennel.", options: ["Inside", "Outside", "On", "Under"], correctAnswer: "Inside" },
            { question: "The bird is flying ___ the cage.", options: ["Outside", "Inside", "Under", "In"], correctAnswer: "Outside" },
            { question: "Put the toys ___ the box.", options: ["Inside", "Outside", "Above", "Far"], correctAnswer: "Inside" }
        ],
        'g1-t2-s2': [ // Identify 3D Shapes
            { question: "A ball looks like a:", options: ["Sphere", "Cube", "Cone", "Square"], correctAnswer: "Sphere" },
            { question: "A dice looks like a:", options: ["Cube", "Circle", "Triangle", "Cone"], correctAnswer: "Cube" },
            { question: "A can of soda looks like a:", options: ["Cylinder", "Sphere", "Cube", "Cone"], correctAnswer: "Cylinder" }
        ],
        'g1-t2-s3': [ // Rolling and Sliding
            { question: "Which object rolls?", options: ["Ball", "Book", "Box", "Brick"], correctAnswer: "Ball" },
            { question: "Which object slides?", options: ["Book", "Ball", "Orange", "Marble"], correctAnswer: "Book" },
            { question: "A wheel ___ on the road.", options: ["Rolls", "Slides", "Jumps", "Flies"], correctAnswer: "Rolls" }
        ],
        'g1-t3-s3': [ // Before, After, Between
            { question: "What comes after 5?", options: ["6", "4", "7", "3"], correctAnswer: "6" },
            { question: "What comes before 9?", options: ["8", "10", "7", "6"], correctAnswer: "8" },
            { question: "What number is between 2 and 4?", options: ["3", "5", "1", "6"], correctAnswer: "3" }
        ],
        'g1-t4-s2': [ // Number Line Addition
            { question: "Start at 2, jump 3 steps forward. Where are you?", options: ["5", "4", "6", "3"], correctAnswer: "5" },
            { question: "4 + 4 =", options: ["8", "7", "9", "6"], correctAnswer: "8" },
            { question: "Start at 5, add 0.", options: ["5", "0", "6", "4"], correctAnswer: "5" }
        ],
        'g1-t4-s3': [ // Word Problems (Addition)
            { question: "I have 2 apples. Mom gave me 2 more. How many now?", options: ["4", "3", "5", "2"], correctAnswer: "4" },
            { question: "3 birds on a tree. 1 more joins. Total birds?", options: ["4", "3", "2", "5"], correctAnswer: "4" },
            { question: "5 red cars and 2 blue cars. Total cars?", options: ["7", "6", "8", "5"], correctAnswer: "7" }
        ],
        'g1-t5-s1': [ // Take Away (Subtraction)
            { question: "5 - 1 =", options: ["4", "5", "6", "3"], correctAnswer: "4" },
            { question: "Take away 2 from 4.", options: ["2", "3", "1", "4"], correctAnswer: "2" },
            { question: "I had 3 candies. I ate 1. How many left?", options: ["2", "1", "3", "0"], correctAnswer: "2" }
        ],
        'g1-t5-s2': [ // Subtraction Facts
            { question: "9 - 0 =", options: ["9", "0", "8", "10"], correctAnswer: "9" },
            { question: "8 - 8 =", options: ["0", "8", "1", "16"], correctAnswer: "0" },
            { question: "7 - 1 =", options: ["6", "7", "8", "5"], correctAnswer: "6" }
        ],
        'g1-t6-s2': [ // Tens and Ones (10-20)
            { question: "15 has __ Ten and __ Ones.", options: ["1, 5", "5, 1", "10, 5", "1, 0"], correctAnswer: "1, 5" },
            { question: "1 Ten and 3 Ones make:", options: ["13", "31", "103", "4"], correctAnswer: "13" },
            { question: "20 is __ Tens.", options: ["2", "1", "0", "20"], correctAnswer: "2" }
        ],
        'g1-t7-s1': [ // Counting Tens
            { question: "10, 20, 30, __", options: ["40", "50", "35", "25"], correctAnswer: "40" },
            { question: "5 Tens is equal to:", options: ["50", "5", "15", "500"], correctAnswer: "50" },
            { question: "Count by 10s: 70, 80, __", options: ["90", "100", "85", "75"], correctAnswer: "90" }
        ],
        'g1-t7-s2': [ // Biggest and Smallest
            { question: "Which is biggest?", options: ["99", "19", "91", "9"], correctAnswer: "99" },
            { question: "Which is smallest?", options: ["11", "22", "33", "10"], correctAnswer: "10" },
            { question: "Arrange small to big: 50, 20, 80", options: ["20, 50, 80", "80, 50, 20", "50, 20, 80", "20, 80, 50"], correctAnswer: "20, 50, 80" }
        ],
        'g1-t8-s1': [ // Longer and Shorter
            { question: "Which is longer?", options: ["Train", "Bus", "Car", "Bike"], correctAnswer: "Train" },
            { question: "Which is shorter?", options: ["Pencil", "Walking Stick", "Tree", "Pole"], correctAnswer: "Pencil" },
            { question: "My finger is ___ than my arm.", options: ["Shorter", "Longer", "Same", "Taller"], correctAnswer: "Shorter" }
        ],
        'g1-t8-s2': [ // Heavier and Lighter
            { question: "Which is heavier?", options: ["Pumpkin", "Tomato", "Grape", "Pea"], correctAnswer: "Pumpkin" },
            { question: "Which is lighter?", options: ["Feather", "Book", "Brick", "Shoe"], correctAnswer: "Feather" },
            { question: "An elephant is ___ than a dog.", options: ["Heavier", "Lighter", "Smaller", "Same"], correctAnswer: "Heavier" }
        ],
        'g1-t9-s1': [ // Daily Routine
            { question: "When do we wake up?", options: ["Morning", "Night", "Evening", "Afternoon"], correctAnswer: "Morning" },
            { question: "When do we eat dinner?", options: ["Night", "Morning", "Afternoon", "Sunrise"], correctAnswer: "Night" },
            { question: "We go to school in the:", options: ["Morning", "Night", "Midnight", "Sunday"], correctAnswer: "Morning" }
        ],
        'g1-t9-s2': [ // Coins and Notes
            { question: "Identify the coin:", options: ["₹1", "₹100", "₹50", "₹20"], correctAnswer: "₹1" },
            { question: "Which is a note?", options: ["₹10", "50p", "25p", "10p"], correctAnswer: "₹10" },
            { question: "Money is used to ___ things.", options: ["Buy", "Throw", "Break", "Eat"], correctAnswer: "Buy" }
        ],
        'g1-t10-s1': [ // Patterns
            { question: "Complete: 🔴 🔵 🔴 🔵 __", options: ["🔴", "🔵", "🟢", "🟡"], correctAnswer: "🔴" },
            { question: "Complete: ▲ ■ ▲ ■ __", options: ["▲", "■", "●", "★"], correctAnswer: "▲" },
            { question: "1, 2, 1, 2, __", options: ["1", "2", "3", "0"], correctAnswer: "1" }
        ],
        'g1-t10-s2': [ // Data Handling
            { question: "Count the stars: ⭐ ⭐ ⭐", options: ["3", "4", "2", "5"], correctAnswer: "3" },
            { question: "Which fruit is most? 🍎🍎🍎 🍌🍌", options: ["Apple", "Banana", "Both", "None"], correctAnswer: "Apple" },
            { question: "How many eyes do you have?", options: ["2", "1", "3", "4"], correctAnswer: "2" }
        ],

        'g1-t3-s2': [ // Number Names
            {
                question: "What is the number name for 5?",
                options: ["Four", "Five", "Six", "Seven"],
                correctAnswer: "Five"
            },
            {
                question: "Choose the number for 'Eight':",
                options: ["6", "7", "8", "9"],
                correctAnswer: "8"
            },
            {
                question: "What is the number name for 1?",
                options: ["One", "Two", "Ten", "Zero"],
                correctAnswer: "One"
            }
        ],
        // --- GRADE 2 QUESTIONS ---
        // Numbers up to 999
        'g2-t1-s1': [ // Counting to 999
            { question: "What comes after 199?", options: ["200", "190", "201", "100"], correctAnswer: "200" },
            { question: "Which number is missing? 550, 551, __, 553", options: ["552", "554", "555", "560"], correctAnswer: "552" },
            { question: "Count forward: 898, 899, ___", options: ["900", "800", "901", "999"], correctAnswer: "900" }
        ],
        'g2-t1-s2': [ // Place Value
            { question: "In 345, what is the place value of 4?", options: ["Tens", "Ones", "Hundreds", "Thousands"], correctAnswer: "Tens" },
            { question: "Which number has 7 in the Hundreds place?", options: ["732", "372", "237", "073"], correctAnswer: "732" },
            { question: "5 Hundreds + 2 Tens + 9 Ones =", options: ["529", "592", "259", "925"], correctAnswer: "529" }
        ],
        'g2-t1-s3': [ // Expanded Form
            { question: "Expand 456", options: ["400 + 50 + 6", "40 + 50 + 6", "400 + 5 + 6", "4 + 5 + 6"], correctAnswer: "400 + 50 + 6" },
            { question: "What is 200 + 30 + 5?", options: ["235", "253", "325", "532"], correctAnswer: "235" },
            { question: "Expand 901", options: ["900 + 1", "900 + 10", "90 + 1", "9 + 0 + 1"], correctAnswer: "900 + 1" }
        ],
        'g2-t1-s4': [ // Comparing Numbers
            { question: "Which is greater: 543 or 534?", options: ["543", "534", "Equal", "None"], correctAnswer: "543" },
            { question: "Choose the smallest number:", options: ["102", "120", "201", "210"], correctAnswer: "102" },
            { question: "Use <, >, or = : 789 __ 798", options: ["<", ">", "=", "+"], correctAnswer: "<" }
        ],
        // Addition
        'g2-t2-s1': [ // 2-Digit Addition
            { question: "23 + 15 =", options: ["38", "48", "37", "28"], correctAnswer: "38" },
            { question: "40 + 20 =", options: ["60", "50", "70", "80"], correctAnswer: "60" },
            { question: "12 + 12 =", options: ["24", "22", "42", "20"], correctAnswer: "24" }
        ],
        'g2-t2-s2': [ // 3-Digit Addition
            { question: "100 + 200 =", options: ["300", "400", "120", "210"], correctAnswer: "300" },
            { question: "123 + 100 =", options: ["223", "133", "323", "124"], correctAnswer: "223" },
            { question: "300 + 50 =", options: ["350", "305", "530", "503"], correctAnswer: "350" }
        ],
        'g2-t2-s3': [ // Addition with Carry
            { question: "18 + 5 =", options: ["23", "22", "13", "33"], correctAnswer: "23" },
            { question: "29 + 14 =", options: ["43", "33", "44", "34"], correctAnswer: "43" },
            { question: "35 + 35 =", options: ["70", "60", "80", "75"], correctAnswer: "70" }
        ],
        // Subtraction
        'g2-t3-s1': [ // 2-Digit Subtraction
            { question: "45 - 5 =", options: ["40", "50", "35", "45"], correctAnswer: "40" },
            { question: "28 - 10 =", options: ["18", "38", "8", "20"], correctAnswer: "18" },
            { question: "33 - 11 =", options: ["22", "44", "12", "21"], correctAnswer: "22" }
        ],
        'g2-t3-s2': [ // 3-Digit Subtraction
            { question: "500 - 100 =", options: ["400", "600", "300", "500"], correctAnswer: "400" },
            { question: "250 - 50 =", options: ["200", "300", "150", "205"], correctAnswer: "200" },
            { question: "125 - 25 =", options: ["100", "150", "120", "25"], correctAnswer: "100" }
        ],
        'g2-t3-s3': [ // Subtraction with Borrow
            { question: "32 - 15 =", options: ["17", "27", "13", "23"], correctAnswer: "17" },
            { question: "50 - 28 =", options: ["22", "32", "28", "12"], correctAnswer: "22" },
            { question: "81 - 9 =", options: ["72", "62", "82", "71"], correctAnswer: "72" }
        ],
        // Multiplication
        'g2-t4-s1': [ // Repeated Addition
            { question: "2 + 2 + 2 is same as:", options: ["3 × 2", "2 × 2", "4 × 2", "3 + 2"], correctAnswer: "3 × 2" },
            { question: "5 + 5 + 5 + 5 =", options: ["4 × 5", "5 × 5", "3 × 5", "6 × 5"], correctAnswer: "4 × 5" },
            { question: "How many legs do 2 dogs have?", options: ["8", "4", "6", "10"], correctAnswer: "8" }
        ],
        'g2-t4-s2': [ // Table of 2
            { question: "2 × 3 =", options: ["6", "5", "8", "4"], correctAnswer: "6" },
            { question: "2 × 8 =", options: ["16", "18", "14", "12"], correctAnswer: "16" },
            { question: "2 × 10 =", options: ["20", "12", "200", "10"], correctAnswer: "20" }
        ],
        'g2-t4-s3': [ // Table of 3
            { question: "3 × 4 =", options: ["12", "14", "9", "15"], correctAnswer: "12" },
            { question: "3 × 3 =", options: ["9", "6", "12", "3"], correctAnswer: "9" },
            { question: "3 × 7 =", options: ["21", "24", "18", "27"], correctAnswer: "21" }
        ],
        'g2-t4-s4': [ // Table of 4
            { question: "4 × 5 =", options: ["20", "25", "15", "24"], correctAnswer: "20" },
            { question: "4 × 2 =", options: ["8", "6", "12", "16"], correctAnswer: "8" },
            { question: "4 × 9 =", options: ["36", "32", "40", "28"], correctAnswer: "36" }
        ],
        'g2-t4-s5': [ // Table of 5
            { question: "5 × 6 =", options: ["30", "35", "25", "20"], correctAnswer: "30" },
            { question: "5 × 1 =", options: ["5", "1", "10", "0"], correctAnswer: "5" },
            { question: "5 × 5 =", options: ["25", "20", "30", "15"], correctAnswer: "25" }
        ],
        'g2-t4-s6': [ // Table of 10
            { question: "10 × 2 =", options: ["20", "12", "200", "100"], correctAnswer: "20" },
            { question: "10 × 5 =", options: ["50", "55", "15", "500"], correctAnswer: "50" },
            { question: "10 × 9 =", options: ["90", "99", "19", "900"], correctAnswer: "90" }
        ],
        // Measurement
        'g2-t5-s1': [ // Length
            { question: "We measure a pencil in:", options: ["cm", "m", "km", "kg"], correctAnswer: "cm" },
            { question: "1 meter = ___ centimeters", options: ["100", "10", "1000", "50"], correctAnswer: "100" },
            { question: "Which is longer?", options: ["Bus", "Car", "Bicycle", "Skateboard"], correctAnswer: "Bus" }
        ],
        'g2-t5-s2': [ // Weight
            { question: "We measure weight in:", options: ["kg and g", "m and cm", "l and ml", "hours"], correctAnswer: "kg and g" },
            { question: "Which is heavier?", options: ["Elephant", "Cat", "Mouse", "Ant"], correctAnswer: "Elephant" },
            { question: "1 kg = ___ grams", options: ["1000", "100", "10", "500"], correctAnswer: "1000" }
        ],
        'g2-t5-s3': [ // Capacity
            { question: "We measure water in:", options: ["Liters", "Meters", "Grams", "Seconds"], correctAnswer: "Liters" },
            { question: "A bucket holds ___ water than a cup.", options: ["More", "Less", "Same", "None"], correctAnswer: "More" },
            { question: "Which holds the least?", options: ["Spoon", "Cup", "Bottle", "Bucket"], correctAnswer: "Spoon" }
        ],
        // Time
        'g2-t6-s1': [ // Reading Clock
            { question: "The long hand shows:", options: ["Minutes", "Hours", "Seconds", "Days"], correctAnswer: "Minutes" },
            { question: "The short hand shows:", options: ["Hours", "Minutes", "Seconds", "Years"], correctAnswer: "Hours" },
            { question: "When both hands are at 12, it is:", options: ["12:00", "6:00", "1:00", "12:30"], correctAnswer: "12:00" }
        ],
        'g2-t6-s2': [ // Days
            { question: "How many days in a week?", options: ["7", "5", "10", "30"], correctAnswer: "7" },
            { question: "Which day comes after Monday?", options: ["Tuesday", "Sunday", "Wednesday", "Friday"], correctAnswer: "Tuesday" },
            { question: "Which is a holiday?", options: ["Sunday", "Monday", "Tuesday", "Friday"], correctAnswer: "Sunday" }
        ],
        'g2-t6-s3': [ // Months
            { question: "How many months in a year?", options: ["12", "10", "6", "24"], correctAnswer: "12" },
            { question: "Which is the first month?", options: ["January", "December", "June", "March"], correctAnswer: "January" },
            { question: "Christmas is in:", options: ["December", "January", "November", "October"], correctAnswer: "December" }
        ],
        // Money
        'g2-t7-s1': [ // Notes and Coins
            { question: "Identify the coin with '₹5':", options: ["5 Rupees", "1 Rupee", "10 Rupees", "2 Rupees"], correctAnswer: "5 Rupees" },
            { question: "Which note is pink?", options: ["₹2000", "₹10", "₹500", "₹100"], correctAnswer: "₹2000" },
            { question: "How many 50 paise make 1 Rupee?", options: ["2", "1", "4", "10"], correctAnswer: "2" }
        ],
        'g2-t7-s2': [ // Counting Money
            { question: "₹10 + ₹10 =", options: ["₹20", "₹30", "₹100", "₹15"], correctAnswer: "₹20" },
            { question: "₹50 + ₹20 =", options: ["₹70", "₹60", "₹80", "₹90"], correctAnswer: "₹70" },
            { question: "You buy a candy for ₹5. You give ₹10. Change?", options: ["₹5", "₹2", "₹1", "₹0"], correctAnswer: "₹5" }
        ],
        // Shapes
        'g2-t8-s1': [ // 2D Properties
            { question: "A triangle has __ corners.", options: ["3", "4", "0", "5"], correctAnswer: "3" },
            { question: "A circle has __ sides.", options: ["0", "1", "2", "4"], correctAnswer: "0" },
            { question: "Opposite sides of a rectangle are:", options: ["Equal", "Different", "Curved", "Zigzag"], correctAnswer: "Equal" }
        ],
        'g2-t8-s2': [ // 3D Properties
            { question: "A ball is a:", options: ["Sphere", "Cube", "Cone", "Cylinder"], correctAnswer: "Sphere" },
            { question: "A dice is a:", options: ["Cube", "Cuboid", "Sphere", "Cone"], correctAnswer: "Cube" },
            { question: "An ice-cream cone is a:", options: ["Cone", "Cylinder", "Sphere", "Cube"], correctAnswer: "Cone" }
        ],
        'g2-t8-s3': [ // Patterns
            { question: "Complete: 2, 4, 6, __", options: ["8", "7", "9", "10"], correctAnswer: "8" },
            { question: "Complete: A, B, C, __", options: ["D", "E", "F", "G"], correctAnswer: "D" },
            { question: "Complete: 10, 20, 30, __", options: ["40", "50", "35", "100"], correctAnswer: "40" }
        ],
        // Data
        'g2-t9-s1': [ // Tables
            { question: "Data can be shown in a:", options: ["Table", "Chair", "Book", "Bag"], correctAnswer: "Table" },
            { question: "We use tally marks to:", options: ["Count", "Draw", "Write", "Read"], correctAnswer: "Count" },
            { question: "||| means:", options: ["3", "4", "2", "5"], correctAnswer: "3" }
        ],
        'g2-t9-s2': [ // Pictographs
            { question: "A pictograph uses ___ to show data.", options: ["Pictures", "Words", "Numbers", "Sounds"], correctAnswer: "Pictures" },
            { question: "If 1 🍎 = 2 apples, then 🍎🍎 =", options: ["4 apples", "2 apples", "3 apples", "5 apples"], correctAnswer: "4 apples" },
            { question: "Graphs make data ___ to understand.", options: ["Easy", "Hard", "Boring", "Slow"], correctAnswer: "Easy" }
        ],
        'default': [
            {
                question: "What is 1 + 1?",
                options: ["1", "2", "3", "4"],
                correctAnswer: "2"
            },
            {
                question: "Which number comes after 4?",
                options: ["3", "5", "6", "2"],
                correctAnswer: "5"
            },
            {
                question: "Count the fingers on one hand:",
                options: ["4", "5", "6", "10"],
                correctAnswer: "5"
            }
        ]
    };

    return questions[topicId] || questions['default'];
};
