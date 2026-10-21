// ---- Default 5 IELTS Academic Reading Practice Tests -----------------------
// Bộ 5 đề IELTS Reading mẫu chuẩn học thuật với đa dạng dạng câu hỏi,
// đáp án chuẩn xác, giải thích chi tiết tiếng Việt và trích dẫn bằng chứng.

const DEFAULT_IELTS_TESTS = [
  {
    id: "ielts_sample_1",
    title: "The Evolution of Writing Systems and Human Literacy",
    category: "Academic Reading",
    section: "Passage 1",
    durationMinutes: 20,
    difficulty: "Band 6.5 - 7.5",
    description: "Khám phá lịch sử hình thành các hệ thống chữ viết từ chữ hình nêm Lưỡng Hà, chữ tượng hình Ai Cập đến bảng chữ cái ngữ âm Hy Lạp và La Mã.",
    passage: {
      title: "The Evolution of Writing Systems and Human Literacy",
      paragraphs: [
        {
          id: "A",
          text: "Writing is arguably among the most transformative intellectual technologies ever conceived by humankind. Before formalized scripts came into existence, human societies depended exclusively on oral tradition and proto-writing—a repertoire of mnemonic devices, tally sticks, and pictographic engravings carved onto bone or cave walls. While these early symbols effectively communicated rudimentary notions such as the tallying of seasonal herds or astrological markers, they lacked the linguistic syntax necessary to transcribe the nuances of spoken human thought. The profound shift from evocative imagery to true phonetic transcription required thousands of years of conceptual refinement."
        },
        {
          id: "B",
          text: "The earliest verified writing system emerged around 3400 BCE in southern Mesopotamia among the Sumerians. Known as cuneiform—derived from the Latin 'cuneus', meaning wedge—this script was created by pressing a sharpened reed stylus into pliable clay tablets. Contrary to the romantic supposition that writing was invented to record poetry or philosophy, archaeological excavations demonstrate that early Sumerian tablets were overwhelmingly administrative and utilitarian. Scribes cataloged grain surpluses, livestock taxes, and commercial barters. Once incised, these clay tablets were dried under the fierce sun or fired in kilns, ensuring enduring durability across millennia."
        },
        {
          id: "C",
          text: "Roughly contemporary with cuneiform was the development of Egyptian hieroglyphs around 3200 BCE. While Sumerian cuneiform gradually evolved toward abstract rectilinear dashes, Egyptian scribes retained elaborate figurative aesthetics. Hieroglyphic inscriptions were primarily engraved on temple monuments, royal tombs, and stone stelae to celebrate dynastic achievements and religious rites. For mundane administrative tasks, however, the Egyptians developed a cursive script known as hieratic, and later demotic, inscribed with reed brushes onto papyrus sheets made from the fibrous pith of Cyperus papyrus plants growing along the Nile."
        },
        {
          id: "D",
          text: "A genuine democratization of literacy did not occur until the emergence of the Proto-Sinaitic and Phoenician alphabets around the mid-second millennium BCE. Early logographic systems, such as Chinese characters or Mesopotamian cuneiform, demanded that pupils memorize thousands of distinct ideograms and syllabic characters, an intellectual endeavor virtually restricted to privileged priestly and bureaucratic elites. The Phoenicians revolutionized this paradigm by isolating roughly twenty-two consonant sounds, assigning a distinct geometric sign to each consonant. Because this economical system was intuitive and easy to learn, literacy spread rapidly among Mediterranean merchants and seafaring traders."
        },
        {
          id: "E",
          text: "When the ancient Greeks adapted the Phoenician abjad around the 8th century BCE, they made the pivotal innovation of assigning characters to vowel sounds, producing the first complete phonetic alphabet. This Greek script was later modified by the Etruscans and subsequently became the Latin alphabet, which now serves as the world's most widely adopted writing system. The trajectory from economic clay receipts in Mesopotamia to phonetic alphabets laid the cognitive foundation for philosophy, scientific inquiry, codification of legal jurisprudence, and modern democratic participation."
        }
      ]
    },
    questions: [
      {
        id: 1,
        type: "matching_headings",
        instruction: "Questions 1–4: Reading Passage 1 has five paragraphs, A–E. Choose the correct heading for Paragraphs A–D from the list below.",
        q: "Paragraph A",
        opts: [
          "i. The limitation of early visual symbols before true writing",
          "ii. Utilitarian accounting as the birth of Mesopotamian script",
          "iii. The sacred and administrative dualism of Egyptian scripts",
          "iv. The phonetic breakthrough that simplified literacy for commerce",
          "v. How modern printing presses decentralized reading"
        ],
        ans: "i. The limitation of early visual symbols before true writing",
        exp: "Đoạn A tập trung miêu tả giai đoạn proto-writing và chỉ ra giới hạn của các biểu tượng sớm (như khắc trên xương hay vách đá) là thiếu cú pháp ngôn ngữ để diễn đạt sắc thái ý nghĩ của con người.",
        evidence: "Đoạn A: 'While these early symbols effectively communicated rudimentary notions... they lacked the linguistic syntax necessary to transcribe the nuances of spoken human thought.'"
      },
      {
        id: 2,
        type: "matching_headings",
        instruction: "Questions 1–4: Choose the correct heading for Paragraphs A–D.",
        q: "Paragraph B",
        opts: [
          "i. The limitation of early visual symbols before true writing",
          "ii. Utilitarian accounting as the birth of Mesopotamian script",
          "iii. The sacred and administrative dualism of Egyptian scripts",
          "iv. The phonetic breakthrough that simplified literacy for commerce",
          "v. How modern printing presses decentralized reading"
        ],
        ans: "ii. Utilitarian accounting as the birth of Mesopotamian script",
        exp: "Đoạn B khẳng định chữ hình nêm Sumerian bắt nguồn từ nhu cầu thực dụng (quản lý ngũ cốc, thuế gia súc, trao đổi buôn bán) chứ không phải để viết thơ ca hay triết học.",
        evidence: "Đoạn B: 'archaeological excavations demonstrate that early Sumerian tablets were overwhelmingly administrative and utilitarian. Scribes cataloged grain surpluses, livestock taxes, and commercial barters.'"
      },
      {
        id: 3,
        type: "matching_headings",
        instruction: "Questions 1–4: Choose the correct heading for Paragraphs A–D.",
        q: "Paragraph C",
        opts: [
          "i. The limitation of early visual symbols before true writing",
          "ii. Utilitarian accounting as the birth of Mesopotamian script",
          "iii. The sacred and administrative dualism of Egyptian scripts",
          "iv. The phonetic breakthrough that simplified literacy for commerce",
          "v. How modern printing presses decentralized reading"
        ],
        ans: "iii. The sacred and administrative dualism of Egyptian scripts",
        exp: "Đoạn C giải thích sự phân tách giữa chữ tượng hình trang trọng dùng trong đền đài/lăng mộ và chữ hieratic/demotic giản lược viết trên giấy cói dùng cho hành chính hàng ngày.",
        evidence: "Đoạn C: 'Hieroglyphic inscriptions were primarily engraved on temple monuments... For mundane administrative tasks, however, the Egyptians developed a cursive script known as hieratic...'"
      },
      {
        id: 4,
        type: "matching_headings",
        instruction: "Questions 1–4: Choose the correct heading for Paragraphs A–D.",
        q: "Paragraph D",
        opts: [
          "i. The limitation of early visual symbols before true writing",
          "ii. Utilitarian accounting as the birth of Mesopotamian script",
          "iii. The sacred and administrative dualism of Egyptian scripts",
          "iv. The phonetic breakthrough that simplified literacy for commerce",
          "v. How modern printing presses decentralized reading"
        ],
        ans: "iv. The phonetic breakthrough that simplified literacy for commerce",
        exp: "Đoạn D phân tích bước ngoặt bảng chữ cái Phoenicia gồm 22 phụ âm giúp người học không phải nhớ hàng ngàn ký tự, từ đó lan tỏa mạnh mẽ trong giới thương gia hàng hải.",
        evidence: "Đoạn D: 'The Phoenicians revolutionized this paradigm by isolating roughly twenty-two consonant sounds... literacy spread rapidly among Mediterranean merchants...'"
      },
      {
        id: 5,
        type: "true_false_not_given",
        instruction: "Questions 5–8: Do the following statements agree with the information given in Reading Passage 1? Write TRUE, FALSE, or NOT GIVEN.",
        q: "Early Sumerian cuneiform was predominantly devised to document philosophical dialogues and literary verse.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "FALSE",
        exp: "Bài đọc nói ngược lại: việc cho rằng chữ viết dùng để ghi thơ ca hay triết lý chỉ là suy đoán lãng mạn, thực tế nó dùng để ghi chép kế toán và thuế.",
        evidence: "Đoạn B: 'Contrary to the romantic supposition that writing was invented to record poetry or philosophy, archaeological excavations demonstrate that early Sumerian tablets were overwhelmingly administrative and utilitarian.'"
      },
      {
        id: 6,
        type: "true_false_not_given",
        instruction: "Questions 5–8: Write TRUE, FALSE, or NOT GIVEN.",
        q: "Egyptian papyrus rolls were noticeably more durable across millennia than Mesopotamian clay tablets.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "NOT GIVEN",
        exp: "Bài đọc chỉ nhắc các phiến đất sét Lưỡng Hà có độ bền hàng ngàn năm ('ensuring enduring durability across millennia'), nhưng không hề so sánh xem giấy cói hay đất sét bền hơn.",
        evidence: "Đoạn B & C: Bài viết không đưa ra bất kỳ so sánh nào về độ bền giữa giấy cói và đất sét nung."
      },
      {
        id: 7,
        type: "true_false_not_given",
        instruction: "Questions 5–8: Write TRUE, FALSE, or NOT GIVEN.",
        q: "The Phoenician alphabet was much faster to learn than older logographic systems because it used fewer symbols.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "TRUE",
        exp: "Bài đọc khẳng định hệ thống này thay thế việc phải ghi nhớ hàng ngàn ký hiệu bằng chỉ khoảng 22 ký tự, nên rất dễ học và dễ hiểu.",
        evidence: "Đoạn D: 'demanded that pupils memorize thousands of distinct ideograms... Because this economical system was intuitive and easy to learn, literacy spread rapidly...'"
      },
      {
        id: 8,
        type: "true_false_not_given",
        instruction: "Questions 5–8: Write TRUE, FALSE, or NOT GIVEN.",
        q: "The ancient Greeks created the first writing system to incorporate symbols for vowel sounds.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "TRUE",
        exp: "Đoạn E khẳng định người Hy Lạp đã tạo ra cải tiến mang tính bản lề là gán ký tự cho các nguyên âm, tạo nên bảng chữ cái ngữ âm hoàn chỉnh đầu tiên.",
        evidence: "Đoạn E: 'When the ancient Greeks adapted the Phoenician abjad... they made the pivotal innovation of assigning characters to vowel sounds, producing the first complete phonetic alphabet.'"
      },
      {
        id: 9,
        type: "multiple_choice",
        instruction: "Questions 9–10: Choose the correct letter, A, B, C or D.",
        q: "According to Paragraph D, why was literacy heavily restricted in ancient Mesopotamia and China?",
        opts: [
          "A. Religious laws made writing forbidden to ordinary citizens.",
          "B. Mastering thousands of individual characters required immense time and specialized training.",
          "C. Rulers refused to distribute writing instruments to commercial traders.",
          "D. Scribes kept phonetic principles secret under threat of royal punishment."
        ],
        ans: "B. Mastering thousands of individual characters required immense time and specialized training.",
        exp: "Đoạn D chỉ rõ việc phải học thuộc hàng ngàn biểu tượng khiến việc biết chữ chỉ giới hạn trong tầng lớp giáo sĩ và quan lại ưu tú.",
        evidence: "Đoạn D: 'Early logographic systems... demanded that pupils memorize thousands of distinct ideograms and syllabic characters, an intellectual endeavor virtually restricted to privileged priestly and bureaucratic elites.'"
      },
      {
        id: 10,
        type: "multiple_choice",
        instruction: "Questions 9–10: Choose the correct letter, A, B, C or D.",
        q: "What role did the Latin alphabet play according to Paragraph E?",
        opts: [
          "A. It emerged directly from Egyptian hieratic without Greek influence.",
          "B. It was solely applied to mathematical measurements in ancient Rome.",
          "C. It evolved from Etruscan modifications of the Greek alphabet into the most widespread global script.",
          "D. It became obsolete following the invention of modern printing."
        ],
        ans: "C. It evolved from Etruscan modifications of the Greek alphabet into the most widespread global script.",
        exp: "Đoạn E mô tả dòng chảy: bảng chữ cái Hy Lạp được người Etruscan biến đổi và sau đó trở thành chữ cái Latin, hiện là hệ thống chữ viết phổ biến nhất toàn cầu.",
        evidence: "Đoạn E: 'This Greek script was later modified by the Etruscans and subsequently became the Latin alphabet, which now serves as the world's most widely adopted writing system.'"
      },
      {
        id: 11,
        type: "fill_blank",
        instruction: "Questions 11–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "Early Mesopotamian scribes inscribed cuneiform wedges into clay tablets using a sharpened ________.",
        ans: "reed stylus",
        exp: "Đoạn B nêu rõ dụng cụ viết là bút sậy được vót nhọn (sharpened reed stylus).",
        evidence: "Đoạn B: 'this script was created by pressing a sharpened reed stylus into pliable clay tablets.'"
      },
      {
        id: 12,
        type: "fill_blank",
        instruction: "Questions 11–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "For everyday bookkeeping, the Egyptians used a faster cursive script called ________.",
        ans: "hieratic",
        exp: "Đoạn C giải thích đối với các công việc hành chính thường nhật, người Ai Cập dùng chữ thảo gọi là hieratic.",
        evidence: "Đoạn C: 'For mundane administrative tasks, however, the Egyptians developed a cursive script known as hieratic...'"
      }
    ]
  },
  {
    id: "ielts_sample_2",
    title: "Artificial Intelligence in Modern Medicine: Promises and Perils",
    category: "Academic Reading",
    section: "Passage 2",
    durationMinutes: 20,
    difficulty: "Band 7.0 - 8.0",
    description: "Phân tích tác động của Machine Learning và Deep Learning trong việc chẩn đoán hình ảnh, phát hiện khối u sớm và những thách thức về đạo đức, thiên vị thuật toán.",
    passage: {
      title: "Artificial Intelligence in Modern Medicine: Promises and Perils",
      paragraphs: [
        {
          id: "A",
          text: "The integration of Artificial Intelligence (AI) and machine learning algorithms into healthcare systems represents a paradigm shift in contemporary clinical practice. Deep learning neural networks, capable of parsing staggering volumes of high-resolution pixel data, are now routinely utilized to inspect radiographic images, computed tomography (CT) scans, and histopathological biopsies. In controlled diagnostic benchmarks, top-tier convolutional neural networks have demonstrated diagnostic accuracy matching, and occasionally surpassing, board-certified radiologists in identifying subtle early-stage pulmonary nodules and malignant melanomas."
        },
        {
          id: "B",
          text: "Beyond diagnostic imaging, computational algorithms are dramatically accelerating the pharmaceutical pipeline. Traditional drug discovery is notoriously prolonged and capital-intensive, typically requiring over a decade and billions of dollars to bring a novel chemical entity from initial synthesis through clinical trials to market authorization. Generative AI models, trained on vast molecular repositories and protein structures, can now simulate molecular docking and predict candidate compound bioavailability in hours. By preemptively weeding out unstable or toxic molecular variants in silico, research institutions slash laboratory experimentation costs substantially."
        },
        {
          id: "C",
          text: "Despite these compelling breakthroughs, the clinical deployment of autonomous medical algorithms faces profound technical hurdles. Prominent among these is the ubiquitous 'black box' dilemma. Unlike conventional deterministic clinical guidelines where each diagnostic deduction follows a transparent step-by-step logic, multilayered neural networks arrive at classifications through millions of non-linear weighted parameters. When an AI system recommends an aggressive surgical intervention or contraindicates a standard chemotherapy regimen, clinicians cannot readily inspect the internal causal reasoning behind the recommendation. This opacity undermines informed consent and complicates professional medical liability."
        },
        {
          id: "D",
          text: "A related vulnerability lies in demographic algorithmic bias. Machine learning models inevitably reflect the statistical attributes of the historical training datasets on which they were calibrated. If training cohorts consist overwhelmingly of demographic data gathered from affluent, Caucasian populations in urban tertiary hospitals, the algorithm may exhibit steep performance degradation when applied to ethnic minorities, rural communities, or underprivileged socioeconomic groups. For instance, dermatological diagnostic models trained primarily on fair skin tones have repeatedly shown elevated false-negative rates when screening darker skin tones, posing grave health disparities."
        },
        {
          id: "E",
          text: "Consequently, most medical ethicists and regulatory authorities, including the US Food and Drug Administration and the European Medicines Agency, advocate for an 'augmented intelligence' paradigm rather than unmonitored autonomy. In this synergistic framework, AI serves as an omnipresent second opinion—flagging imperceptible anomalies, automating tedious administrative transcription, and ranking triage urgencies—while final diagnostic determinations and therapeutic choices remain firmly anchored in human clinical empathy and ethical judgment."
        }
      ]
    },
    questions: [
      {
        id: 1,
        type: "yes_no_not_given",
        instruction: "Questions 1–4: Do the following statements agree with the views of the writer in Reading Passage 2? Write YES, NO, or NOT GIVEN.",
        q: "In certain specialized tests, AI systems have shown diagnostic precision equal to experienced medical specialists.",
        opts: ["YES", "NO", "NOT GIVEN"],
        ans: "YES",
        exp: "Tác giả chỉ ra rằng trong các bài kiểm tra chẩn đoán có đối chứng, các mạng nơ-ron tích chập hàng đầu đã đạt độ chính xác ngang ngửa hoặc vượt qua các bác sĩ X-quang có chứng chỉ.",
        evidence: "Đoạn A: 'neural networks have demonstrated diagnostic accuracy matching, and occasionally surpassing, board-certified radiologists...'"
      },
      {
        id: 2,
        type: "yes_no_not_given",
        instruction: "Questions 1–4: Write YES, NO, or NOT GIVEN.",
        q: "Traditional drug development typically takes less than three years from laboratory synthesis to market entry.",
        opts: ["YES", "NO", "NOT GIVEN"],
        ans: "NO",
        exp: "Bài đọc nêu rõ phương pháp phát triển thuốc truyền thống thường mất hơn một thập kỷ (over a decade, tức hơn 10 năm), chứ không phải dưới 3 năm.",
        evidence: "Đoạn B: 'Traditional drug discovery is notoriously prolonged... typically requiring over a decade and billions of dollars...'"
      },
      {
        id: 3,
        type: "yes_no_not_given",
        instruction: "Questions 1–4: Write YES, NO, or NOT GIVEN.",
        q: "Pharmaceutical companies spend more money marketing drugs than utilizing generative AI models.",
        opts: ["YES", "NO", "NOT GIVEN"],
        ans: "NOT GIVEN",
        exp: "Bài đọc nói rằng mô hình AI giúp cắt giảm chi phí thử nghiệm phòng thí nghiệm, nhưng không hề đề cập đến chi phí marketing của các công ty dược.",
        evidence: "Đoạn B: Không có thông tin so sánh giữa chi phí marketing và việc sử dụng AI trong phát triển thuốc."
      },
      {
        id: 4,
        type: "yes_no_not_given",
        instruction: "Questions 1–4: Write YES, NO, or NOT GIVEN.",
        q: "The 'black box' problem in neural networks makes it difficult for doctors to determine the exact reasons for an AI recommendation.",
        opts: ["YES", "NO", "NOT GIVEN"],
        ans: "YES",
        exp: "Đoạn C giải thích rằng vì các mạng nơ-ron hoạt động qua hàng triệu tham số phi tuyến, bác sĩ không thể dễ dàng kiểm tra lập luận nguyên nhân - kết quả bên trong.",
        evidence: "Đoạn C: 'clinicians cannot readily inspect the internal causal reasoning behind the recommendation. This opacity undermines informed consent...'"
      },
      {
        id: 5,
        type: "multiple_choice",
        instruction: "Questions 5–8: Choose the correct letter, A, B, C or D.",
        q: "What is the primary benefit of generative AI in pharmacology mentioned in Paragraph B?",
        opts: [
          "A. It completely eliminates the necessity for human clinical trials.",
          "B. It simulates molecular interactions and screens out unstable candidate molecules quickly.",
          "C. It creates synthetic patient populations for immediate commercial testing.",
          "D. It replaces all existing active chemical substances with digital alternatives."
        ],
        ans: "B. It simulates molecular interactions and screens out unstable candidate molecules quickly.",
        exp: "Đoạn B nêu rõ AI mô phỏng liên kết phân tử và loại bỏ sớm các phân tử độc hại hoặc không bền vững ngay trên máy tính (in silico).",
        evidence: "Đoạn B: 'simulate molecular docking and predict candidate compound bioavailability in hours. By preemptively weeding out unstable or toxic molecular variants in silico...'"
      },
      {
        id: 6,
        type: "multiple_choice",
        instruction: "Questions 5–8: Choose the correct letter, A, B, C or D.",
        q: "Why do AI models sometimes fail when applied to ethnic minorities as highlighted in Paragraph D?",
        opts: [
          "A. Minorities have genetic predispositions that computer chips cannot compute.",
          "B. Historical training data often originates disproportionately from affluent, Caucasian patients.",
          "C. Regulatory agencies prohibit AI tools from processing non-urban hospital records.",
          "D. Deep learning algorithms are programmed to discard diverse demographic variables."
        ],
        ans: "B. Historical training data often originates disproportionately from affluent, Caucasian patients.",
        exp: "Đoạn D phân tích sự thiên lệch dữ liệu: bộ dữ liệu huấn luyện lịch sử chủ yếu lấy từ người da trắng khá giả ở các bệnh viện tuyến trung ương.",
        evidence: "Đoạn D: 'If training cohorts consist overwhelmingly of demographic data gathered from affluent, Caucasian populations in urban tertiary hospitals, the algorithm may exhibit steep performance degradation...'"
      },
      {
        id: 7,
        type: "multiple_choice",
        instruction: "Questions 5–8: Choose the correct letter, A, B, C or D.",
        q: "What does the term 'augmented intelligence' in Paragraph E refer to?",
        opts: [
          "A. An AI system that operates completely without any human physician oversight.",
          "B. Implanting microchips into the brains of medical personnel to expand memory.",
          "C. A collaborative partnership where AI assists clinicians while humans make final clinical decisions.",
          "D. Replacing hospital nursing staff with robotic triage assistants."
        ],
        ans: "C. A collaborative partnership where AI assists clinicians while humans make final clinical decisions.",
        exp: "Đoạn E giải thích AI đóng vai trò như ý kiến tham vấn thứ hai (second opinion), hỗ trợ cảnh báo và giảm tải việc hành chính, còn quyết định cuối cùng vẫn thuộc về bác sĩ con người.",
        evidence: "Đoạn E: 'AI serves as an omnipresent second opinion... while final diagnostic determinations and therapeutic choices remain firmly anchored in human clinical empathy and ethical judgment.'"
      },
      {
        id: 8,
        type: "multiple_choice",
        instruction: "Questions 5–8: Choose the correct letter, A, B, C or D.",
        q: "What risk arises when medical professionals cannot inspect the causal reasoning of an AI decision?",
        opts: [
          "A. Radiographic scanner hardware immediately overheats.",
          "B. Professional medical liability and informed patient consent become deeply problematic.",
          "C. Hospital network bandwidth becomes congested.",
          "D. Patients refuse to take any prescribed pharmaceutical products."
        ],
        ans: "B. Professional medical liability and informed patient consent become deeply problematic.",
        exp: "Đoạn C kết luận rằng sự thiếu minh bạch (opacity) làm suy yếu quyền được thông báo của bệnh nhân và gây phức tạp cho trách nhiệm pháp lý nghề nghiệp của bác sĩ.",
        evidence: "Đoạn C: 'This opacity undermines informed consent and complicates professional medical liability.'"
      },
      {
        id: 9,
        type: "fill_blank",
        instruction: "Questions 9–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "Deep learning models inspect high-resolution pixel data from CT scans and histopathological ________.",
        ans: "biopsies",
        exp: "Đoạn A liệt kê các loại hình ảnh y tế mà AI phân tích gồm X-quang, CT scan và sinh thiết mô bệnh học (biopsies).",
        evidence: "Đoạn A: 'routinely utilized to inspect radiographic images, computed tomography (CT) scans, and histopathological biopsies.'"
      },
      {
        id: 10,
        type: "fill_blank",
        instruction: "Questions 9–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "The lack of transparency in neural network decisions is famously known as the ________ dilemma.",
        ans: "black box",
        exp: "Đoạn C đề cập đến tình thế nan giải nổi tiếng về 'hộp đen' (black box dilemma).",
        evidence: "Đoạn C: 'Prominent among these is the ubiquitous 'black box' dilemma.'"
      },
      {
        id: 11,
        type: "fill_blank",
        instruction: "Questions 9–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "Dermatological diagnostic tools trained on pale skin exhibited higher rates of ________ when evaluating darker skin tones.",
        ans: "false-negative",
        exp: "Đoạn D chỉ ra rằng các mô hình chẩn đoán da liễu có tỷ lệ âm tính giả (false-negative) cao hơn khi kiểm tra da tối màu.",
        evidence: "Đoạn D: 'have repeatedly shown elevated false-negative rates when screening darker skin tones...'"
      },
      {
        id: 12,
        type: "fill_blank",
        instruction: "Questions 9–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "Under the proposed augmented intelligence approach, the final therapeutic choice must remain anchored in human ________.",
        ans: "clinical empathy",
        exp: "Đoạn E nhấn mạnh các quyết định trị liệu phải neo chặt vào sự đồng cảm lâm sàng và phán đoán đạo đức của con người.",
        evidence: "Đoạn E: 'therapeutic choices remain firmly anchored in human clinical empathy and ethical judgment.'"
      }
    ]
  },
  {
    id: "ielts_sample_3",
    title: "Biomimicry: Engineering Inspired by Nature's Masterpieces",
    category: "Academic Reading",
    section: "Passage 3",
    durationMinutes: 20,
    difficulty: "Band 7.0 - 8.0",
    description: "Khám phá ngành phỏng sinh học (Biomimicry) - cách các kỹ sư học hỏi cấu trúc từ da cá mập, mạng nhện, cánh chim bói cá và ụ mối để kiến tạo công nghệ bền vững.",
    passage: {
      title: "Biomimicry: Engineering Inspired by Nature's Masterpieces",
      paragraphs: [
        {
          id: "A",
          text: "For approximately 3.8 billion years, biological organisms have undergone relentless natural selection, iteratively troubleshooting environmental hurdles ranging from structural stability and aerodynamic friction to thermoregulation. The emerging discipline of biomimicry—a term popularized by science writer Janine Benyus—seeks to reverse-engineer these battle-tested biological adaptations to solve complex anthropogenic engineering quandaries. Rather than exploiting nature as a consumable raw material, biomimicry treats the living ecosystem as a profound catalog of sustainable design blueprints."
        },
        {
          id: "B",
          text: "A canonical exemplar of biomimetic transport engineering is the aerodynamic redesign of the Japanese Shinkansen bullet train. In the late 20th century, earlier iterations of the high-speed train confronted a disruptive physical phenomenon: when exiting narrow tunnels at speeds exceeding 250 kilometers per hour, the train pushed atmospheric air ahead of it, triggering a violent sonic boom that agitated nearby residents. Eiji Nakatsu, the chief engineer and an avid birder, observed that kingfishers plunge effortlessly from thin air into dense water with virtually undetectable splashing. By remodeling the Shinkansen's blunt locomotive nose into an elongated, beak-like contour, engineers eliminated tunnel shockwaves, increased travel speed, and reduced electrical power consumption by fifteen percent."
        },
        {
          id: "C",
          text: "In materials science, the remarkable hydrodynamic properties of shark skin have spawned revolutionary surface coatings. Microscopic examination reveals that shark skin is not smooth, but clad in millions of overlapping ribbed dermal scales known as denticles. These grooves channel fluid flow, suppressing turbulent vortices and drastically reducing drag. When synthetic microscopic textures mimicking denticles were bonded to naval vessel hulls, fuel efficiency surged. Furthermore, medical researchers observed that this micro-topography inhibits bacterial adhesion. Applying shark-inspired films to hospital countertops and catheters impedes pathogen colonization without antibiotics, mitigating drug-resistant bacterial proliferation."
        },
        {
          id: "D",
          text: "Architectural design has similarly borrowed from biological self-cooling architectures, most strikingly demonstrated by the Eastgate Centre in Harare, Zimbabwe, designed by Mick Pearce. In central Africa, diurnal temperatures swing wildly, yet towering termite mounds maintain an internal climate within one degree Celsius throughout the year. Termites accomplish this through passive ventilation: subterranean chimneys continually exhaust hot air upward while drawing cooler air through low apertures. Pearce replicated this labyrinthine chimney network in the mid-rise commercial complex, eliminating traditional air-conditioning units and using ninety percent less energy than conventional office edifices."
        },
        {
          id: "E",
          text: "Despite these triumphs, translating organic evolution into industrial manufacturing remains challenging. Biological systems grow bottom-up at ambient temperatures via organic molecules, whereas human heavy industry primarily relies on high-temperature, top-down subtractive manufacturing using synthetic polymers and metallurgical alloys. Nevertheless, as nanotechnology and additive 3D-printing mature, biomimetic methodologies will undoubtedly transition from isolated technical curiosities into the bedrock of ecologically restorative industrial ecology."
        }
      ]
    },
    questions: [
      {
        id: 1,
        type: "matching_headings",
        instruction: "Questions 1–4: Reading Passage 3 has five paragraphs, A–E. Which paragraph contains the following information?",
        q: "An explanation of how a bird's hunting behavior solved an acoustic noise problem in transit design.",
        opts: ["Paragraph A", "Paragraph B", "Paragraph C", "Paragraph D", "Paragraph E"],
        ans: "Paragraph B",
        exp: "Đoạn B mô tả cách chim bói cá lao xuống nước mà không tạo sóng nước đã truyền cảm hứng để thiết kế lại đầu tàu Shinkansen, loại bỏ tiếng nổ siêu thanh (sonic boom).",
        evidence: "Đoạn B: 'By remodeling the Shinkansen's blunt locomotive nose into an elongated, beak-like contour, engineers eliminated tunnel shockwaves...'"
      },
      {
        id: 2,
        type: "matching_headings",
        instruction: "Questions 1–4: Which paragraph contains the following information?",
        q: "A non-chemical method for deterring microbial colonization inspired by marine predators.",
        opts: ["Paragraph A", "Paragraph B", "Paragraph C", "Paragraph D", "Paragraph E"],
        ans: "Paragraph C",
        exp: "Đoạn C giải thích vảy da cá mập (denticles) ngăn cản vi khuẩn bám dính trên bề mặt thiết bị bệnh viện mà không cần dùng kháng sinh.",
        evidence: "Đoạn C: 'Applying shark-inspired films to hospital countertops and catheters impedes pathogen colonization without antibiotics...'"
      },
      {
        id: 3,
        type: "matching_headings",
        instruction: "Questions 1–4: Which paragraph contains the following information?",
        q: "A commercial building that mimics insect colonies to accomplish passive temperature regulation.",
        opts: ["Paragraph A", "Paragraph B", "Paragraph C", "Paragraph D", "Paragraph E"],
        ans: "Paragraph D",
        exp: "Đoạn D mô tả tòa nhà Eastgate Centre ở Zimbabwe học hỏi cấu trúc tổ mối để tạo hệ thống thông gió thụ động, tiết kiệm 90% năng lượng.",
        evidence: "Đoạn D: 'Pearce replicated this labyrinthine chimney network in the mid-rise commercial complex, eliminating traditional air-conditioning units...'"
      },
      {
        id: 4,
        type: "matching_headings",
        instruction: "Questions 1–4: Which paragraph contains the following information?",
        q: "The fundamental discrepancies between biological growth processes and traditional manufacturing methods.",
        opts: ["Paragraph A", "Paragraph B", "Paragraph C", "Paragraph D", "Paragraph E"],
        ans: "Paragraph E",
        exp: "Đoạn E phân tích sự khác biệt: tự nhiên phát triển từ dưới lên (bottom-up) ở nhiệt độ phòng, trong khi công nghiệp con người dùng gia công trừ ở nhiệt độ cao.",
        evidence: "Đoạn E: 'Biological systems grow bottom-up at ambient temperatures... whereas human heavy industry primarily relies on high-temperature, top-down subtractive manufacturing...'"
      },
      {
        id: 5,
        type: "true_false_not_given",
        instruction: "Questions 5–8: Do the following statements agree with the information given in Reading Passage 3? Write TRUE, FALSE, or NOT GIVEN.",
        q: "Biomimicry views the natural world primarily as a warehouse of physical timber and ores to be extracted.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "FALSE",
        exp: "Bài đọc nói ngược lại: thay vì bóc lột thiên nhiên như nguyên liệu thô tiêu dùng, biomimicry coi hệ sinh thái là danh mục các bản thiết kế bền vững.",
        evidence: "Đoạn A: 'Rather than exploiting nature as a consumable raw material, biomimicry treats the living ecosystem as a profound catalog of sustainable design blueprints.'"
      },
      {
        id: 6,
        type: "true_false_not_given",
        instruction: "Questions 5–8: Write TRUE, FALSE, or NOT GIVEN.",
        q: "Modifying the train nose profile led to reduced electrical energy demands on the Shinkansen rail network.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "TRUE",
        exp: "Đoạn B khẳng định thiết kế mỏ chim giúp tăng tốc độ và giảm 15% năng lượng tiêu thụ điện.",
        evidence: "Đoạn B: 'engineers eliminated tunnel shockwaves, increased travel speed, and reduced electrical power consumption by fifteen percent.'"
      },
      {
        id: 7,
        type: "true_false_not_given",
        instruction: "Questions 5–8: Write TRUE, FALSE, or NOT GIVEN.",
        q: "Shark-skin films applied in hospitals kill all existing pathogens upon contact.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "FALSE",
        exp: "Bài đọc chỉ nói cấu trúc bề mặt này cản trở vi khuẩn bám dính (inhibits bacterial adhesion, impedes pathogen colonization), chứ không nói là tiêu diệt tức thì toàn bộ mầm bệnh.",
        evidence: "Đoạn C: 'this micro-topography inhibits bacterial adhesion. Applying shark-inspired films... impedes pathogen colonization without antibiotics...'"
      },
      {
        id: 8,
        type: "true_false_not_given",
        instruction: "Questions 5–8: Write TRUE, FALSE, or NOT GIVEN.",
        q: "The Eastgate Centre had to install auxiliary diesel generators due to frequent power outages in Harare.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "NOT GIVEN",
        exp: "Bài đọc không đề cập đến máy phát điện diesel hay tình trạng cúp điện ở Harare.",
        evidence: "Đoạn D: Bài viết chỉ tập trung vào hệ thống thông gió thụ động tiết kiệm năng lượng của tòa nhà."
      },
      {
        id: 9,
        type: "multiple_choice",
        instruction: "Questions 9–10: Choose the correct letter, A, B, C or D.",
        q: "What aerodynamic phenomenon caused loud disturbances when older bullet trains entered tunnels?",
        opts: [
          "A. Friction from steel wheels deforming track ties.",
          "B. Rapid compression of air ahead of the train generating a sonic boom.",
          "C. Engine combustion exhaust detonating in tight spaces.",
          "D. Electrostatic discharges sparking against overhead power cables."
        ],
        ans: "B. Rapid compression of air ahead of the train generating a sonic boom.",
        exp: "Đoạn B giải thích tàu đẩy không khí phía trước tạo ra sóng xung kích nổ siêu thanh khi thoát khỏi đường hầm hẹp.",
        evidence: "Đoạn B: 'when exiting narrow tunnels at speeds exceeding 250 kilometers per hour, the train pushed atmospheric air ahead of it, triggering a violent sonic boom...'"
      },
      {
        id: 10,
        type: "multiple_choice",
        instruction: "Questions 9–10: Choose the correct letter, A, B, C or D.",
        q: "According to Paragraph E, what technologies will help bridge the gap between biological design and manufacturing?",
        opts: [
          "A. Coal-fired blast furnaces and automated assembly lines.",
          "B. Nanotechnology and additive 3D-printing.",
          "C. Genetic cloning of extinct marine reptiles.",
          "D. Massive oceanic dredging of biological materials."
        ],
        ans: "B. Nanotechnology and additive 3D-printing.",
        exp: "Đoạn E khẳng định khi công nghệ nano và in 3D bồi đắp trưởng thành, phương pháp phỏng sinh học sẽ trở thành nền tảng của nền sinh thái công nghiệp.",
        evidence: "Đoạn E: 'Nevertheless, as nanotechnology and additive 3D-printing mature, biomimetic methodologies will undoubtedly transition...'"
      },
      {
        id: 11,
        type: "fill_blank",
        instruction: "Questions 11–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "The ribbed scales on shark skin that suppress fluid vortices are scientifically termed ________.",
        ans: "denticles",
        exp: "Đoạn C giải thích các vảy bì có gờ của cá mập được gọi là denticles.",
        evidence: "Đoạn C: 'overlapping ribbed dermal scales known as denticles.'"
      },
      {
        id: 12,
        type: "fill_blank",
        instruction: "Questions 11–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "Termites regulate internal nest temperatures through an effective mechanism of ________ ventilation.",
        ans: "passive",
        exp: "Đoạn D nêu mối duy trì nhiệt độ bằng hệ thống thông gió thụ động (passive ventilation).",
        evidence: "Đoạn D: 'Termites accomplish this through passive ventilation: subterranean chimneys continually exhaust hot air...'"
      }
    ]
  },
  {
    id: "ielts_sample_4",
    title: "The Psychology of Decision-Making and Cognitive Biases",
    category: "Academic Reading",
    section: "Passage 4",
    durationMinutes: 20,
    difficulty: "Band 6.5 - 7.5",
    description: "Nghiên cứu về cơ chế tư duy nhanh và chậm (Hệ thống 1 & 2 của Daniel Kahneman), hiệu ứng mỏ neo và sự thiên lệch xác nhận trong kinh tế học hành vi.",
    passage: {
      title: "The Psychology of Decision-Making and Cognitive Biases",
      paragraphs: [
        {
          id: "A",
          text: "For decades, classical economic theory was predicated upon the model of Homo economicus—the assumption that human actors behave as flawlessly rational agents who systematically calculate costs, benefits, and probabilistic outcomes to maximize individual utility. However, pioneering empirical investigations conducted in the late 20th century by psychologists Daniel Kahneman and Amos Tversky decisively dismantled this orthodox presumption. Their findings revealed that human judgment routinely deviates from normative logic due to subconscious mental shortcuts known as heuristics."
        },
        {
          id: "B",
          text: "In his seminal dual-process cognitive framework, Kahneman delineates two distinctive architectures of mental cognition: System 1 and System 2. System 1 operates automatically, rapidly, and unconsciously, with little or no exertion of voluntary control. It effortlessly interprets emotional facial expressions, steers around familiar obstacles, and executes habitual tasks. Conversely, System 2 allocates focused attention to demanding cognitive operations, such as calculating complex mental arithmetic, verifying logical syllogisms, or making solemn investments. While System 1 is indispensable for evolutionary survival in time-sensitive hazards, its reliance on crude associative intuition renders it susceptible to systematic cognitive distortions."
        },
        {
          id: "C",
          text: "Among the most pernicious distortions generated by System 1 is the anchoring effect. When individuals are challenged to evaluate numerical uncertainty—such as pricing real estate or estimating historical dates—their appraisals are disproportionately influenced by the initial numerical reference point presented to them, even if that anchor is overtly irrelevant. In controlled experiments, participants spun a rigged wheel of fortune displaying arbitrary numbers before estimating the percentage of African nations in the United Nations; those who observed a high anchor consistently provided substantially elevated estimates compared to those exposed to low anchors."
        },
        {
          id: "D",
          text: "Equally pervasive is confirmation bias, the psychological tendency to selectively seek, interpret, and retain data that substantiates one's preexisting convictions while discounting or actively rationalizing contradictory facts. In high-stakes institutional domains such as medical diagnostics, judicial sentencing, and corporate risk underwriting, confirmation bias can culminate in catastrophic oversights. Once an analyst forms an initial diagnostic working hypothesis, they unconsciously prioritize confirmatory symptoms while treating counter-indicators as anomalous statistical flukes."
        },
        {
          id: "E",
          text: "Understanding these inherent cognitive traps has catalyzed the rise of behavioral design and 'nudge theory', conceptualized by Richard Thaler and Cass Sunstein. Rather than enforcing draconian mandates or relying on naive appeals to rationality, institutional architects can subtly configure decision environments. For example, automatically enrolling employees in retirement savings plans while preserving their freedom to opt out dramatically magnifies savings rates. By aligning choice architecture with human psychological predispositions, societies can engineer environments that foster welfare without restricting liberty."
        }
      ]
    },
    questions: [
      {
        id: 1,
        type: "true_false_not_given",
        instruction: "Questions 1–4: Do the following statements agree with the information given in Reading Passage 4? Write TRUE, FALSE, or NOT GIVEN.",
        q: "Classical economic theorists believed human beings routinely make decisions based on logical utility calculations.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "TRUE",
        exp: "Đoạn A nêu rõ lý thuyết kinh tế cổ điển dựa trên mô hình Homo economicus: con người hành động hoàn toàn lý trí và tính toán chi phí - lợi ích.",
        evidence: "Đoạn A: 'classical economic theory was predicated upon the model of Homo economicus—the assumption that human actors behave as flawlessly rational agents...'"
      },
      {
        id: 2,
        type: "true_false_not_given",
        instruction: "Questions 1–4: Write TRUE, FALSE, or NOT GIVEN.",
        q: "System 2 thought processes require less conscious effort and energy than System 1.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "FALSE",
        exp: "Đoạn B khẳng định System 1 hoạt động tự động và hầu như không tốn sức, trong khi System 2 đòi hỏi sự tập trung cao độ và nỗ lực nhận thức lớn.",
        evidence: "Đoạn B: 'System 1 operates automatically... with little or no exertion... Conversely, System 2 allocates focused attention to demanding cognitive operations...'"
      },
      {
        id: 3,
        type: "true_false_not_given",
        instruction: "Questions 1–4: Write TRUE, FALSE, or NOT GIVEN.",
        q: "Amos Tversky passed away before receiving the Nobel Memorial Prize in Economic Sciences.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "NOT GIVEN",
        exp: "Bài đọc nhắc đến nghiên cứu của Daniel Kahneman và Amos Tversky, nhưng không đề cập đến giải Nobel hay thời điểm qua đời của Tversky.",
        evidence: "Đoạn A: Bài viết chỉ giới thiệu hai nhà tâm lý học và công trình nghiên cứu của họ, không đề cập đến giải thưởng hay tiểu sử."
      },
      {
        id: 4,
        type: "true_false_not_given",
        instruction: "Questions 1–4: Write TRUE, FALSE, or NOT GIVEN.",
        q: "The anchoring effect only occurs when the initial numerical value comes from an authoritative and credible source.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "FALSE",
        exp: "Đoạn C chứng minh hiệu ứng mỏ neo xuất hiện ngay cả khi con số ban đầu hoàn toàn ngẫu nhiên và không liên quan (như vòng quay may mắn đã bị gian lận).",
        evidence: "Đoạn C: 'their appraisals are disproportionately influenced by the initial numerical reference point presented to them, even if that anchor is overtly irrelevant.'"
      },
      {
        id: 5,
        type: "multiple_choice",
        instruction: "Questions 5–8: Choose the correct letter, A, B, C or D.",
        q: "Which of the following activities is most likely governed by System 1 according to Paragraph B?",
        opts: [
          "A. Comparing mortgage terms across five banking institutions.",
          "B. Solving multi-digit mathematical division problems.",
          "C. Reading the emotional expression on a colleague's face.",
          "D. Formulating an appeal for a legal courtroom trial."
        ],
        ans: "C. Reading the emotional expression on a colleague's face.",
        exp: "Đoạn B chỉ ra System 1 xử lý dễ dàng các cảm xúc trên nét mặt (interprets emotional facial expressions).",
        evidence: "Đoạn B: 'It effortlessly interprets emotional facial expressions, steers around familiar obstacles, and executes habitual tasks.'"
      },
      {
        id: 6,
        type: "multiple_choice",
        instruction: "Questions 5–8: Choose the correct letter, A, B, C or D.",
        q: "How does confirmation bias manifest in professional medical diagnostics as described in Paragraph D?",
        opts: [
          "A. Doctors deliberately fabricate test results to earn financial commissions.",
          "B. Clinicians focus heavily on symptoms supporting their initial idea while ignoring contradictory signs.",
          "C. Medical staff refuse to use diagnostic computer equipment.",
          "D. Surgeons operate only on patients with whom they share political views."
        ],
        ans: "B. Clinicians focus heavily on symptoms supporting their initial idea while ignoring contradictory signs.",
        exp: "Đoạn D giải thích bác sĩ vô tình ưu tiên các triệu chứng củng cố giả thuyết ban đầu và coi các dấu hiệu trái ngược là sự ngẫu nhiên cá biệt.",
        evidence: "Đoạn D: 'an analyst forms an initial diagnostic working hypothesis, they unconsciously prioritize confirmatory symptoms while treating counter-indicators as anomalous statistical flukes.'"
      },
      {
        id: 7,
        type: "multiple_choice",
        instruction: "Questions 5–8: Choose the correct letter, A, B, C or D.",
        q: "What is the core premise of 'nudge theory' according to Paragraph E?",
        opts: [
          "A. Enacting harsh penalties for individuals who fail to make healthy decisions.",
          "B. Banning freedom of choice in personal financial investments.",
          "C. Designing decision environments that subtly guide beneficial choices without restricting freedom.",
          "D. Relying exclusively on extensive educational lectures to change behavior."
        ],
        ans: "C. Designing decision environments that subtly guide beneficial choices without restricting freedom.",
        exp: "Đoạn E giải thích thay vì áp đặt mệnh lệnh, các kiến trúc sư thể chế tinh chỉnh môi trường lựa chọn để khuyến khích hành vi tốt mà vẫn bảo vệ quyền tự do.",
        evidence: "Đoạn E: 'subtly configure decision environments... By aligning choice architecture with human psychological predispositions, societies can engineer environments that foster welfare without restricting liberty.'"
      },
      {
        id: 8,
        type: "multiple_choice",
        instruction: "Questions 5–8: Choose the correct letter, A, B, C or D.",
        q: "What example of a successful nudge is provided in Paragraph E?",
        opts: [
          "A. Taxing sugary drinks at extreme rates.",
          "B. Default automatic enrollment in retirement savings with an opt-out option.",
          "C. Mandatory daily physical exercises for civil servants.",
          "D. Publicizing the names of citizens who do not vote."
        ],
        ans: "B. Default automatic enrollment in retirement savings with an opt-out option.",
        exp: "Đoạn E đưa ra ví dụ tự động đăng ký nhân viên vào quỹ hưu trí kèm theo quyền tự nguyện rút lui đã giúp gia tăng tỷ lệ tiết kiệm đáng kể.",
        evidence: "Đoạn E: 'automatically enrolling employees in retirement savings plans while preserving their freedom to opt out dramatically magnifies savings rates.'"
      },
      {
        id: 9,
        type: "fill_blank",
        instruction: "Questions 9–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "Mental shortcuts that allow humans to make rapid intuitive judgments are known as ________.",
        ans: "heuristics",
        exp: "Đoạn A nêu rõ các lối tắt tư duy tiềm thức được gọi là heuristics.",
        evidence: "Đoạn A: 'human judgment routinely deviates from normative logic due to subconscious mental shortcuts known as heuristics.'"
      },
      {
        id: 10,
        type: "fill_blank",
        instruction: "Questions 9–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "The theoretical economic model depicting humans as perfectly rational calculative actors is called ________.",
        ans: "Homo economicus",
        exp: "Đoạn A giới thiệu mô hình con người kinh tế lý trí là Homo economicus.",
        evidence: "Đoạn A: 'classical economic theory was predicated upon the model of Homo economicus...'"
      },
      {
        id: 11,
        type: "fill_blank",
        instruction: "Questions 9–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "The subconscious tendency to search for facts validating preexisting views is called ________ bias.",
        ans: "confirmation",
        exp: "Đoạn D giải thích xu hướng tâm lý tìm kiếm thông tin củng cố niềm tin có sẵn là confirmation bias.",
        evidence: "Đoạn D: 'Equally pervasive is confirmation bias, the psychological tendency to selectively seek, interpret, and retain data...'"
      },
      {
        id: 12,
        type: "fill_blank",
        instruction: "Questions 9–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "Nudge theory principles were conceptualized by Richard Thaler and ________.",
        ans: "Cass Sunstein",
        exp: "Đoạn E nêu rõ lý thuyết cú hích (nudge theory) được phát triển bởi Richard Thaler và Cass Sunstein.",
        evidence: "Đoạn E: 'conceptualized by Richard Thaler and Cass Sunstein.'"
      }
    ]
  },
  {
    id: "ielts_sample_5",
    title: "The Urban Heat Island Effect and Sustainable Architecture",
    category: "Academic Reading",
    section: "Passage 5",
    durationMinutes: 20,
    difficulty: "Band 7.0 - 8.0",
    description: "Phân tích hiện tượng đảo nhiệt đô thị (UHI), nguyên nhân nhiệt điện do bê tông hóa và các giải pháp hạ tầng xanh như mái nhà thực vật, sơn phản xạ nhiệt albedo cao.",
    passage: {
      title: "The Urban Heat Island Effect and Sustainable Architecture",
      paragraphs: [
        {
          id: "A",
          text: "As global demographics tilt inexorably toward metropolitan living, urban climatologists are grappling with the intensifying phenomenon known as the Urban Heat Island (UHI) effect. Defined as the measurable temperature differential wherein urban zones experience substantially elevated temperatures relative to neighboring rural hinterlands, UHIs are not merely minor inconveniences. During summer heatwaves, ambient nighttime temperatures in dense urban cores can exceed surrounding countryside baselines by five to ten degrees Celsius. This nocturnal thermal retention exacerbates cardiovascular stress, amplifies smog formation, and drives astronomical surges in municipal air-conditioning electricity demand."
        },
        {
          id: "B",
          text: "The underlying genesis of the UHI effect stems from the dramatic alteration of the Earth's natural surface properties. Natural terrain—composed of permeable soil, humid wetlands, and expansive vegetation canopies—regulates ambient thermal energy through evapotranspiration, a natural thermodynamic cooling process wherein liquid moisture absorbed by plant root systems is released into the atmosphere as water vapor. In stark contrast, modern metropolis construction replaces permeable vegetative cover with impermeable anthropogenic materials such as asphalt paving, concrete slabs, and brick facades. These materials possess high thermal mass and exceptionally low solar reflectance (albedo), acting as vast thermal sponges that absorb solar radiation throughout the day and steadily re-radiate it as longwave heat long after dusk."
        },
        {
          id: "C",
          text: "Exacerbating this material dilemma is the geometrical configuration of modern skylines, known colloquially as the 'urban canyon' effect. Narrow streets flanked by precipitous high-rise towers restrict prevailing horizontal wind currents, stifling natural aerodynamic ventilation that would otherwise disperse stagnant heat pockets. Furthermore, vertical glass and masonry facades cause incoming solar rays to bounce repeatedly between adjacent structures rather than escaping back toward the upper troposphere. Compounding this entrapped radiative thermal load is the omnipresent release of anthropogenic waste heat vented directly from automobile exhaust manifolds, commercial refrigeration compressors, and industrial cooling towers."
        },
        {
          id: "D",
          text: "To combat these escalating microclimatic crises, innovative municipal planners and civil architects are pioneering nature-based mitigation blueprints. Paramount among these is the deployment of green infrastructure, notably extensive living roofs (green roofs) and vertical exterior gardens. By overlaying building envelopes with drought-tolerant vegetation such as Sedum species, structures achieve twofold thermodynamic benefits: the vegetation provides immediate shading that shields roof membranes from ultraviolet degradation, while active evapotranspiration cools the proximate microclimate. Empirical measurements indicate that an extensive green roof can lower ambient rooftop surface temperatures by up to twenty-five degrees Celsius on scorching midsummer days."
        },
        {
          id: "E",
          text: "Complementary to botanical interventions is the adoption of high-albedo cool materials. Civil engineers have engineered specialized reflective roof coatings and permeable light-colored road sealants that reflect up to eighty percent of solar wavelengths directly back into space. Concurrently, permeable pavements engineered with porous porous aggregate matrices permit stormwater infiltration into underlying soil aquifers, restoring the hydrological cycle in dense districts. As climatic oscillations induce increasingly volatile thermal extremes, integrating these architectural mitigations will be decisive in transforming hazardous concrete heat sinks into resilient, livable urban habitats."
        }
      ]
    },
    questions: [
      {
        id: 1,
        type: "matching_headings",
        instruction: "Questions 1–4: Reading Passage 5 has five paragraphs, A–E. Choose the correct heading for Paragraphs A–D from the list below.",
        q: "Paragraph A",
        opts: [
          "i. The definition and hazardous repercussions of elevated city temperatures",
          "ii. Thermodynamic mechanisms converting natural landscapes into heat sponges",
          "iii. The structural and human-made entrapment of heat in urban canyons",
          "iv. Botanical solutions on building surfaces to restore evapotranspiration",
          "v. Economic incentives for suburban solar panel installation"
        ],
        ans: "i. The definition and hazardous repercussions of elevated city temperatures",
        exp: "Đoạn A định nghĩa hiện tượng đảo nhiệt đô thị (UHI) và liệt kê các tác hại: căng thẳng tim mạch, hình thành khói mù, quá tải lưới điện điều hòa nhiệt độ.",
        evidence: "Đoạn A: 'Defined as the measurable temperature differential... This nocturnal thermal retention exacerbates cardiovascular stress, amplifies smog formation...'"
      },
      {
        id: 2,
        type: "matching_headings",
        instruction: "Questions 1–4: Choose the correct heading for Paragraphs A–D.",
        q: "Paragraph B",
        opts: [
          "i. The definition and hazardous repercussions of elevated city temperatures",
          "ii. Thermodynamic mechanisms converting natural landscapes into heat sponges",
          "iii. The structural and human-made entrapment of heat in urban canyons",
          "iv. Botanical solutions on building surfaces to restore evapotranspiration",
          "v. Economic incentives for suburban solar panel installation"
        ],
        ans: "ii. Thermodynamic mechanisms converting natural landscapes into heat sponges",
        exp: "Đoạn B phân tích nguyên nhân gốc rễ: việc thay thế thảm thực vật thoát hơi nước bằng vật liệu nhân tạo (bê tông, nhựa đường) có độ phản xạ thấp (albedo) và hấp thụ nhiệt như bọt biển.",
        evidence: "Đoạn B: 'The underlying genesis of the UHI effect stems from... asphalt paving, concrete slabs... acting as vast thermal sponges that absorb solar radiation...'"
      },
      {
        id: 3,
        type: "matching_headings",
        instruction: "Questions 1–4: Choose the correct heading for Paragraphs A–D.",
        q: "Paragraph C",
        opts: [
          "i. The definition and hazardous repercussions of elevated city temperatures",
          "ii. Thermodynamic mechanisms converting natural landscapes into heat sponges",
          "iii. The structural and human-made entrapment of heat in urban canyons",
          "iv. Botanical solutions on building surfaces to restore evapotranspiration",
          "v. Economic incentives for suburban solar panel installation"
        ],
        ans: "iii. The structural and human-made entrapment of heat in urban canyons",
        exp: "Đoạn C giải thích hiện tượng hẻm vực đô thị (urban canyon), nhà cao tầng chặn gió, ánh nắng phản xạ qua lại giữa các vách kính và nhiệt thải từ xe cộ, máy lạnh.",
        evidence: "Đoạn C: 'Narrow streets flanked by precipitous high-rise towers restrict prevailing horizontal wind currents... vertical glass and masonry facades cause incoming solar rays to bounce...'"
      },
      {
        id: 4,
        type: "matching_headings",
        instruction: "Questions 1–4: Choose the correct heading for Paragraphs A–D.",
        q: "Paragraph D",
        opts: [
          "i. The definition and hazardous repercussions of elevated city temperatures",
          "ii. Thermodynamic mechanisms converting natural landscapes into heat sponges",
          "iii. The structural and human-made entrapment of heat in urban canyons",
          "iv. Botanical solutions on building surfaces to restore evapotranspiration",
          "v. Economic incentives for suburban solar panel installation"
        ],
        ans: "iv. Botanical solutions on building surfaces to restore evapotranspiration",
        exp: "Đoạn D mô tả các giải pháp thực vật: mái nhà xanh (green roofs) và vườn tường đứng giúp che nắng và làm mát bằng thoát hơi nước.",
        evidence: "Đoạn D: 'paramount among these is the deployment of green infrastructure, notably extensive living roofs... active evapotranspiration cools the proximate microclimate.'"
      },
      {
        id: 5,
        type: "true_false_not_given",
        instruction: "Questions 5–8: Do the following statements agree with the information given in Reading Passage 5? Write TRUE, FALSE, or NOT GIVEN.",
        q: "At night during summer heatwaves, urban centers can be up to ten degrees warmer than rural areas.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "TRUE",
        exp: "Đoạn A nêu nhiệt độ ban đêm ở trung tâm đô thị có thể vượt mức nông thôn xung quanh từ 5 đến 10 độ C.",
        evidence: "Đoạn A: 'ambient nighttime temperatures in dense urban cores can exceed surrounding countryside baselines by five to ten degrees Celsius.'"
      },
      {
        id: 6,
        type: "true_false_not_given",
        instruction: "Questions 5–8: Write TRUE, FALSE, or NOT GIVEN.",
        q: "Natural landscapes release moisture into the atmosphere through a biological process called evapotranspiration.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "TRUE",
        exp: "Đoạn B khẳng định địa hình tự nhiên điều hòa nhiệt qua quá trình thoát hơi nước evapotranspiration.",
        evidence: "Đoạn B: 'regulates ambient thermal energy through evapotranspiration, a natural thermodynamic cooling process...'"
      },
      {
        id: 7,
        type: "true_false_not_given",
        instruction: "Questions 5–8: Write TRUE, FALSE, or NOT GIVEN.",
        q: "The city of Tokyo has mandated that all commercial buildings install vertical gardens by 2030.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "NOT GIVEN",
        exp: "Bài đọc không hề đề cập đến thành phố Tokyo hay bất kỳ đạo luật bắt buộc nào vào năm 2030.",
        evidence: "Đoạn D: Bài viết chỉ mô tả giải pháp kỹ thuật chung của mái nhà xanh và vườn đứng."
      },
      {
        id: 8,
        type: "true_false_not_given",
        instruction: "Questions 5–8: Write TRUE, FALSE, or NOT GIVEN.",
        q: "Cool reflective roof coatings can reflect up to eighty percent of solar wavelengths back into space.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "TRUE",
        exp: "Đoạn E khẳng định các lớp phủ mái nhà phản xạ chuyên dụng có thể phản chiếu lại tới 80% bước sóng năng lượng mặt trời.",
        evidence: "Đoạn E: 'specialized reflective roof coatings... that reflect up to eighty percent of solar wavelengths directly back into space.'"
      },
      {
        id: 9,
        type: "multiple_choice",
        instruction: "Questions 9–10: Choose the correct letter, A, B, C or D.",
        q: "What is one consequence of the 'urban canyon' effect mentioned in Paragraph C?",
        opts: [
          "A. It causes underground water pipes to freeze in winter.",
          "B. High-rise buildings block horizontal wind currents, preventing heat dispersal.",
          "C. Birds are unable to navigate across tall buildings.",
          "D. Concrete pavement cracks rapidly due to lack of sunlight."
        ],
        ans: "B. High-rise buildings block horizontal wind currents, preventing heat dispersal.",
        exp: "Đoạn C giải thích các tòa nhà cao tầng kề sát các con phố hẹp cản trở các luồng gió ngang, ngăn chặn sự lưu thông gió tự nhiên để phân tán nhiệt.",
        evidence: "Đoạn C: 'Narrow streets flanked by precipitous high-rise towers restrict prevailing horizontal wind currents, stifling natural aerodynamic ventilation...'"
      },
      {
        id: 10,
        type: "multiple_choice",
        instruction: "Questions 9–10: Choose the correct letter, A, B, C or D.",
        q: "How do permeable pavements assist in mitigating urban environmental damage according to Paragraph E?",
        opts: [
          "A. They emit cool breezes through chemical reactions with carbon dioxide.",
          "B. They allow stormwater to soak through to underlying aquifers, restoring natural hydrology.",
          "C. They generate solar electricity when vehicles drive over them.",
          "D. They melt street litter automatically using stored heat."
        ],
        ans: "B. They allow stormwater to soak through to underlying aquifers, restoring natural hydrology.",
        exp: "Đoạn E giải thích vỉa hè thấm nước cho phép nước mưa thấm xuống tầng chứa nước ngầm bên dưới, khôi phục vòng tuần hoàn nước tự nhiên.",
        evidence: "Đoạn E: 'permit stormwater infiltration into underlying soil aquifers, restoring the hydrological cycle in dense districts.'"
      },
      {
        id: 11,
        type: "fill_blank",
        instruction: "Questions 11–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "Asphalt and concrete surfaces possess high thermal mass and unusually low solar ________.",
        ans: "reflectance",
        exp: "Đoạn B giải thích vật liệu xây dựng có độ phản xạ năng lượng mặt trời cực thấp (low solar reflectance, còn gọi là albedo).",
        evidence: "Đoạn B: 'These materials possess high thermal mass and exceptionally low solar reflectance (albedo)...'"
      },
      {
        id: 12,
        type: "fill_blank",
        instruction: "Questions 11–12: Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        q: "Extensive living roofs frequently utilize drought-tolerant plants from the genus ________.",
        ans: "Sedum",
        exp: "Đoạn D nêu loài thực vật chịu hạn thường được trồng trên mái nhà xanh là các loài thuộc chi Sedum.",
        evidence: "Đoạn D: 'By overlaying building envelopes with drought-tolerant vegetation such as Sedum species...'"
      }
    ]
  }
];

// Helper xuất ra JSON template mẫu cho người dùng tham khảo và tự soạn đề
function getIeltsTemplateJSON() {
  const template = {
    id: "ielts_custom_my_test",
    title: "Tiêu đề bài thi IELTS (Ví dụ: The Future of Renewable Energy)",
    category: "Academic Reading",
    section: "Passage 1",
    durationMinutes: 20,
    difficulty: "Band 6.5 - 7.5",
    description: "Mô tả ngắn về chủ đề bài đọc và các dạng câu hỏi...",
    passage: {
      title: "The Future of Renewable Energy",
      paragraphs: [
        {
          id: "A",
          text: "Nội dung đoạn A của bài đọc tiếng Anh..."
        },
        {
          id: "B",
          text: "Nội dung đoạn B của bài đọc tiếng Anh..."
        }
      ]
    },
    questions: [
      {
        id: 1,
        type: "multiple_choice",
        instruction: "Choose the correct letter, A, B, C or D.",
        q: "What is the primary theme discussed in Paragraph A?",
        opts: [
          "A. First option",
          "B. Second option",
          "C. Third option",
          "D. Fourth option"
        ],
        ans: "A. First option",
        exp: "Giải thích chi tiết bằng tiếng Việt lý do chọn A...",
        evidence: "Trích dẫn câu chứa từ khóa trong đoạn A..."
      },
      {
        id: 2,
        type: "true_false_not_given",
        instruction: "Do the following statements agree with the information given in the passage? Write TRUE, FALSE or NOT GIVEN.",
        q: "Renewable energy has completely replaced fossil fuels worldwide.",
        opts: ["TRUE", "FALSE", "NOT GIVEN"],
        ans: "FALSE",
        exp: "Giải thích vì sao nhận định này sai...",
        evidence: "Trích dẫn chứng cứ trong đoạn B..."
      },
      {
        id: 3,
        type: "matching_headings",
        instruction: "Choose the correct heading for each paragraph from the list below.",
        q: "Paragraph A",
        opts: [
          "i. Heading one",
          "ii. Heading two",
          "iii. Heading three"
        ],
        ans: "i. Heading one",
        exp: "Giải thích ý chính của đoạn A...",
        evidence: "Đoạn A..."
      },
      {
        id: 4,
        type: "fill_blank",
        instruction: "Complete the sentence below. Choose NO MORE THAN TWO WORDS from the passage.",
        q: "Solar power relies heavily on the conversion of ________ into electricity.",
        ans: "sunlight",
        exp: "Giải thích đáp án điền vào chỗ trống...",
        evidence: "Đoạn B: '...conversion of sunlight into electrical currents...'"
      }
    ]
  };
  return JSON.stringify(template, null, 2);
}
