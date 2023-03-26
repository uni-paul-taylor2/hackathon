const { getParameterCaseInsensitive } = require("./helpers");

const respSep = "|";
async function getQuizWithExplanation(openai, title, excerpt) {

    const messageChoices = [
        [
            { role: "system", content: "You generate multiple choice questions based on a specific topic, in a specified format." },
            {
                role: "user", content: `Take note of this topic. Do not do anything else except say "ok" when done:

"Trinidad and Tobago, island country of the southeastern West Indies. It consists of two main islands—Trinidad and Tobago—and several smaller islands. Forming the two southernmost links in the Caribbean chain, Trinidad and Tobago lie close to the continent of South America, northeast of Venezuela and northwest of Guyana. Trinidad, by far the larger of the two main islands, has an area of about 1,850 square miles (4,800 square km). It is 7 miles (11 km) from the Venezuelan coast at its nearest point and is separated from it by the Gulf of Paria and two narrow channels, where there are several small islands and rocks. Tobago, much smaller, with an area of about 115 square miles (300 square km), lies 20 miles (30 km) to the northeast of Trinidad."`
            },
            { role: "assistant", content: "Ok." },
            {
                role: "user", content: `Generate 5 multiple choice questions about this topic alone! All questions and answers should be from this topic alone, and no other information. The alternative wrong answers can be random similar options, but the question and answer must be extracted from this topic alone. There are 5 options to choose from for each question, from a to e, and one of them will be the correct answer. Also provide the letter answer as well as a short explanation for the answer. 

Use the format:
<question here>${respSep}<option a>${respSep}<option b>${respSep}<option c>${respSep}<option d>${respSep}<option e>${respSep}[<letter answer>]${respSep}<explanation>

An example in this format will be:
What is the capital city of Trinidad and Tobago?${respSep}Port-au-Prince${respSep}Kingston${respSep}Port of Spain${respSep}Santo Domingo${respSep}Tokyo${respSep}[C]${respSep}Port of Spain is the capital of Trinidad and Tobago.`
            },
            {
                role: "assistant", content: `In what continent is Trinidad and Tobago located?${respSep}North America${respSep}South America${respSep}Europe${respSep}Asia${respSep}Africa${respSep}[B]${respSep}Trinidad and Tobago are located in the southeastern West Indies, which is part of South America.

Which island is larger, Trinidad or Tobago?${respSep}Trinidad${respSep}Tobago${respSep}They have the same size${respSep}Cannot be determined from the passage${respSep}None of the above${respSep}[A]${respSep}Trinidad is larger than Tobago, with an area of about 1,850 square miles (4,800 square km), while Tobago has an area of about 115 square miles (300 square km).

What is the distance between Trinidad and Tobago?${respSep}7 miles${respSep}20 miles${respSep}11 km${respSep}30 km${respSep}Cannot be determined from the passage${respSep}[B]${respSep}Tobago lies 20 miles (30 km) to the northeast of Trinidad.

What body of water separates Trinidad from the Venezuelan coast?${respSep}Atlantic Ocean${respSep}Gulf of Mexico${respSep}Gulf of Paria${respSep}Caribbean Sea${respSep}Pacific Ocean${respSep}[C]${respSep}The Gulf of Paria separates Trinidad from the Venezuelan coast.

How many main islands are there in Trinidad and Tobago?${respSep}One${respSep}Two${respSep}Three${respSep}Four${respSep}Cannot be determined from the passage${respSep}[B]${respSep}There are two main islands in Trinidad and Tobago, namely Trinidad and Tobago.`
            },
        ],
        [
            {
                role: "user", content: `Take note of this topic. Do not do anything else except say "ok" when done:

            "I came into the valley, as the evening sun was shining on the remote heights of snow, that closed it in, like eternal clouds. The bases of the mountains forming the gorge in which the little village lay, were richly green; and high above this gentler vegetation, grew forests of dark fir, cleaving the wintry snow-drift, wedge-like, and stemming the avalanche. Above these, were range upon range of craggy steeps, grey rock, bright ice, and smooth verdure-specks of pasture, all gradually blending with the crowning snow. Dotted here and there on the mountain’s-side, each tiny dot a home, were lonely wooden cottages, so dwarfed by the towering heights that they appeared too small for toys."`
            },
            {
                role: "assistant", content: "Ok."
            },
            {
                role: "user", content: `Generate 5 multiple choice questions about this topic alone! All questions and answers should be from this topic alone, and no other information. The alternative wrong answers can be random similar options, but the question and answer must be extracted from this topic alone. There are 5 options to choose from for each question, from a to e, and one of them will be the correct answer. Also provide the letter answer as well as a short explanation for the answer. 

            Use the format:
            <question here>${respSep}<option a>${respSep}<option b>${respSep}<option c>${respSep}<option d>${respSep}<option e>${respSep}[<letter answer>]${respSep}<explanation>

            An example in this format will be:
            What is the capital city of Trinidad and Tobago?${respSep}Port-au-Prince${respSep}Kingston${respSep}Port of Spain${respSep}Santo Domingo${respSep}Tokyo${respSep}[C]${respSep}Port of Spain is the capital of Trinidad and Tobago.`
            },
            {
                role: "assistant", content: `What is the main setting described in the passage?${respSep}A forest${respSep}A valley${respSep}A mountain range${respSep}A desert${respSep}An ocean${respSep}[B]${respSep}The main setting described in the passage is a valley.

            What was the color of the bases of the mountains?${respSep}Green${respSep}White${respSep}Grey${respSep}Black${respSep}Brown${respSep}[A]${respSep}The bases of the mountains were described as "richly green."

            What type of vegetation grew above the gentler vegetation in the valley?${respSep}Tropical plants${respSep}Forests of dark fir${respSep}Cacti${respSep}Grasslands${respSep}Tulips${respSep}[B]${respSep}Forests of dark fir were described as growing above the gentler vegetation.

            What appeared too small for toys in the mountain-side?${respSep}Forests${respSep}Cottages${respSep}Verdure-specks${respSep}Pastures${respSep}Rock formations${respSep}[B]${respSep}Lonely wooden cottages appeared too small for toys in the mountain-side.

            What colors were present in the range upon range of craggy steeps?${respSep}Black rock, white ice, and brown verdure-specks${respSep}Grey rock, bright ice, and smooth verdure-specks of pasture${respSep}Red rock, black ice, and green verdure-specks of pasture${respSep}Brown rock, white ice, and yellow verdure-specks of pasture${respSep}Green rock, white ice, and black verdure-specks of pasture${respSep}[B]${respSep}The colors described in the range upon range of craggy steeps were grey rock, bright ice, and smooth verdure-specks of pasture.`
            },
        ]
    ]
    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        // prompt: "Say this is a test",
        messages: [
            ...messageChoices[0],
            {
                role: "user", content: `Take note of this topic. Do not do anything else except say "ok" when done:

"${excerpt}"`
            },
            {
                role: "assistant", content: "Ok."
            },
            {
                role: "user", content: `Generate 5 multiple choice questions about this topic alone! All questions and answers should be from this topic alone, and no other information. The alternative wrong answers can be random similar options, but the question and answer must be extracted from this topic alone. There are 5 options to choose from for each question, from a to e, and one of them will be the correct answer. Also provide the letter answer as well as a short explanation for the answer. 

Use the format:
<question here>${respSep}<option a>${respSep}<option b>${respSep}<option c>${respSep}<option d>${respSep}<option e>${respSep}[<letter answer>]${respSep}<explanation>

An example in this format will be:
What is the capital city of Trinidad and Tobago?${respSep}Port-au-Prince${respSep}Kingston${respSep}Port of Spain${respSep}Santo Domingo${respSep}Tokyo${respSep}[C]${respSep}Port of Spain is the capital of Trinidad and Tobago.`
            },
        ],
        temperature: 0.4,
    });

    const questionList = response.data.choices[0].message.content;

    const questions = parseQuestions(title, excerpt, questionList);

    return questions;
}


function parseQuestions(title, excerpt, data) {
    let topic = {
        title,
        excerpt,
        questions: {}
    };
    const questionStrings = data.split("\n\n");

    for (const questionString of questionStrings) {
        const responses = questionString.split(respSep);

        if (responses.length !== 8)
            continue;

        let theSwitch = { A: 0, B: 1, C: 2, D: 3, E: 4 }  //for conversion of answer to indexOf correct answer

        const [Q, a, b, c, d, e, A, E] = responses;

        if (topic.questions[Q]) continue;


        const answerID = theSwitch[A[1]]; //A[1] is the answer's letter
        const question = {
            question: Q,
            options: [
                [a],
                [b],
                [c],
                [d],
                [e]
            ],
            answer: answerID,
            explanation: E,
            correct: 0, incorrect: 0 //accuracy for a subtopic because yes
        }
        question.options[answerID].push("<answer>"); // let specific response know its own answer so when scrambled we will still know

        topic.questions[Q] = question;

    }

    return topic;
}

module.exports = getQuizWithExplanation;


// main(`Danidre was a curious girl with a love for learning. She spent most of her free time reading books on various subjects, including birds. One day, while studying in her room, she noticed the purple curtains billowing in the wind. She got up to close the window, but as she did, she saw a bird perched on a tree outside. It was a beautiful flevarj, a rare bird known for its unique purple and green feathers.

// Danidre couldn't believe her luck. She grabbed her binoculars and rushed outside to get a closer look. As she observed the bird, she noticed a car pull up in front of her house. It was a woman from the local university who was looking for volunteers to help with an education program for underprivileged children. Danidre was intrigued and immediately signed up to help.

// Over the next few weeks, Danidre spent her afternoons teaching children about birds and the environment. She even brought in her own bird-watching equipment to show the children the different types of birds in their area. One day, while on a field trip with the children, they came across a flock of flevarjs. Danidre was overjoyed, and the children were amazed by the bird's unique colors and patterns.

// As the education program came to a close, Danidre reflected on the impact it had on her and the children she worked with. She realized that education was a powerful tool that could change lives and open doors to new opportunities. She also knew that the flevarjs she had seen were a symbol of the beauty and wonder that could be found in the world if you only took the time to look.

// In the end, Danidre's love for birds had not only led her to discover the rare and beautiful flevarj but had also inspired her to make a difference in her community. She knew that education was the key to unlocking a brighter future for all, and she was determined to continue sharing her passion for learning with others. As she looked out the window at the purple curtains blowing in the wind, she knew that anything was possible if you had the courage to chase your dreams.`);