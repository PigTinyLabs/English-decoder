// ---- Reading: truyện song ngữ mẫu (do dự án tự viết) ------------------------------------
// Định dạng chung cho mọi cuốn sách (truyện mẫu lẫn EPUB đã nhập):
// { id, title, level, cover, chapters: [{ title, paras: [{ en, vi }] }] }
// Một đoạn có thể chỉ có `vi` (lời giới thiệu) hoặc chỉ có `en` (bản chưa dịch).

function storyChapter(title, pairs) {
  return { title, paras: pairs.map(([en, vi]) => ({ en, vi })) };
}

const SAMPLE_BOOKS = [
  {
    id: "sample-umbrella", title: "The Black Umbrella", titleVi: "Chiếc ô đen", level: "A2", cover: "☂️",
    chapters: [storyChapter("The Black Umbrella", [
      ["It was raining hard when Lan left the office.", "Trời đang mưa to khi Lan rời văn phòng."],
      ["She looked in her bag, but her umbrella was not there.", "Cô ấy nhìn vào túi, nhưng chiếc ô không có ở đó."],
      ["\"I must have left it on the bus this morning,\" she thought.", "\"Chắc mình để quên nó trên xe buýt sáng nay rồi,\" cô nghĩ."],
      ["An old man was standing next to her at the door.", "Một ông cụ đang đứng cạnh cô ở cửa."],
      ["He smiled and held out a big black umbrella.", "Ông mỉm cười và chìa ra một chiếc ô đen to."],
      ["\"Take it. I live just around the corner,\" he said.", "\"Cầm lấy đi. Tôi sống ngay góc phố thôi,\" ông nói."],
      ["Lan didn't want to take it, but the old man insisted.", "Lan không muốn nhận, nhưng ông cụ cứ nài."],
      ["The next day, she went back to return the umbrella.", "Ngày hôm sau, cô quay lại để trả chiếc ô."],
      ["Nobody on the street knew an old man with a black umbrella.", "Không ai trên phố biết một ông cụ với chiếc ô đen."],
      ["Lan still keeps the umbrella by her door.", "Lan vẫn giữ chiếc ô bên cạnh cửa nhà mình."],
      ["Every time it rains, she lends it to someone who needs it.", "Mỗi lần trời mưa, cô lại cho ai đó cần nó mượn."],
    ])],
  },
  {
    id: "sample-first-day", title: "Ben's First Day", titleVi: "Ngày đầu đi làm của Ben", level: "A2–B1", cover: "👔",
    chapters: [
      storyChapter("1. Three Alarms", [
        ["Ben had set three alarms, but he still woke up late.", "Ben đã đặt ba cái báo thức, nhưng cậu vẫn dậy muộn."],
        ["His new job started at nine, and it was already a quarter past eight.", "Công việc mới của cậu bắt đầu lúc chín giờ, mà lúc đó đã tám giờ mười lăm rồi."],
        ["He jumped out of bed, put on his shirt and ran to the kitchen.", "Cậu nhảy ra khỏi giường, mặc áo sơ mi và chạy vào bếp."],
        ["There was no time for breakfast, so he grabbed an apple.", "Không có thời gian ăn sáng, nên cậu vớ lấy một quả táo."],
        ["On the way to the station, he realized his shirt was inside out.", "Trên đường ra ga, cậu nhận ra mình mặc áo bị trái."],
      ]),
      storyChapter("2. The Office", [
        ["Ben arrived at the office at exactly nine o'clock.", "Ben đến văn phòng đúng chín giờ."],
        ["A tall woman with glasses was waiting for him at the front desk.", "Một người phụ nữ cao đeo kính đang đợi cậu ở quầy lễ tân."],
        ["\"You must be Ben. I'm Sarah, your manager,\" she said with a smile.", "\"Cậu hẳn là Ben. Tôi là Sarah, quản lý của cậu,\" cô ấy nói kèm nụ cười."],
        ["Then she looked at his shirt and laughed.", "Rồi cô nhìn áo cậu và bật cười."],
        ["\"Don't worry. On my first day, I wore two different shoes.\"", "\"Đừng lo. Ngày đầu tiên đi làm, tôi đã đi hai chiếc giày khác nhau.\""],
        ["Ben laughed too, and suddenly he didn't feel so nervous anymore.", "Ben cũng cười, và bỗng nhiên cậu không còn thấy hồi hộp nữa."],
      ]),
    ],
  },
  {
    id: "sample-night-market", title: "The Night Market", titleVi: "Phiên chợ đêm", level: "B1", cover: "🏮",
    chapters: [storyChapter("The Night Market", [
      ["Every Saturday night, the empty parking lot near my house turns into a market.", "Mỗi tối thứ Bảy, bãi đỗ xe trống gần nhà tôi biến thành một khu chợ."],
      ["By seven o'clock, it is full of lights, music and the smell of grilled corn.", "Đến bảy giờ, nơi đó ngập tràn ánh đèn, âm nhạc và mùi ngô nướng."],
      ["My grandmother has sold sweet soup there for almost twenty years.", "Bà tôi đã bán chè ở đó gần hai mươi năm."],
      ["She says the secret is not the sugar, but the way you talk to people.", "Bà bảo bí quyết không nằm ở đường, mà ở cách mình nói chuyện với mọi người."],
      ["She remembers every customer's name and what they like to order.", "Bà nhớ tên từng vị khách và món họ thích gọi."],
      ["Last week, a young man stopped at her stall and looked at her for a long time.", "Tuần trước, một chàng trai dừng lại ở sạp của bà và nhìn bà rất lâu."],
      ["\"You gave me free soup when I was a poor student,\" he said quietly.", "\"Bà đã cho cháu chè miễn phí hồi cháu còn là sinh viên nghèo,\" anh nói khẽ."],
      ["Now he was a doctor, and he had come back to say thank you.", "Giờ anh ấy đã là bác sĩ, và anh quay lại để nói lời cảm ơn."],
      ["My grandmother didn't remember him at first, but she remembered his order.", "Lúc đầu bà không nhớ ra anh, nhưng bà nhớ món anh hay gọi."],
      ["\"Black bean soup, extra ice,\" she said, and they both laughed.", "\"Chè đậu đen, thêm đá,\" bà nói, và cả hai cùng cười."],
      ["That night I understood why she never wanted to stop working at the market.", "Tối hôm đó tôi hiểu vì sao bà chưa bao giờ muốn nghỉ bán ở chợ."],
    ])],
  },
];
