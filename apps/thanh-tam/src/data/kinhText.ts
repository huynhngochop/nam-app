// Tệp sinh tự động bởi scripts/gen_kinh_ts.py, đừng sửa tay.
// Chữ kinh: âm Hán Việt và bản dịch Việt từ kho "Kinh nhật tụng" (github.com/phineas-pta/kinh_nhat_tung),
// phát hành theo Unlicense (phạm vi công cộng).
import type { KinhPara } from './types';

export const KINH_TEXT: Record<string, { title: string; kind: 'kinh' | 'chu' | 'ke'; paras: KinhPara[] }> = {
  'tan-lu-huong': {
    title: 'Tán Lư Hương',
    kind: 'ke',
    paras: [
      {
        l: [
          'Lư hương sạ nhiệt',
          'Pháp giới mông huân',
          'Chư Phật hải hội tất diêu văn',
          'Tùy xứ kiết tường vân',
          'Thành ý phương ân',
          'Chư Phật hiện toàn thân',
        ],
        vi: [
          'Lư hương vừa ngún chiên đàn',
          'Khói xông pháp giới đạo tràng cõi xa',
          'Lòng con kính ngưỡng thiết tha',
          'Ngưỡng trông ơn Phật thương mà chứng minh',
        ],
      },
      {
        l: ['Nam mô Hương Vân Cái Bồ tát Ma ha tát'],
      },
    ],
  },
  'khai-kinh': {
    title: 'Khai Kinh Kệ',
    kind: 'ke',
    paras: [
      {
        l: ['Vô thượng thậm thâm vi diệu pháp'],
        vi: ['Pháp Phật cao sâu rất nhiệm mầu,'],
      },
      {
        l: ['Bá thiên vạn kiếp nan tao ngộ'],
        vi: ['Trăm nghìn muôn ức kiếp khó gặp,'],
      },
      {
        l: ['Ngã kim kiến văn đắc thọ trì'],
        vi: ['Con nay thấy nghe xin thọ trì'],
      },
      {
        l: ['Nguyện giải Như Lai chân thiệt nghĩa'],
        vi: ['Nguyện hiểu nghĩa chân thật của Như Lai'],
      },
    ],
  },
  'bat-nha': {
    title: 'Bát Nhã Tâm Kinh',
    kind: 'kinh',
    paras: [
      {
        l: ['Quán Tự Tại Bồ tát, hành thâm Bát nhã Ba la mật đa thời,'],
      },
      {
        l: ['chiếu kiến ngũ uẩn giai không, độ nhất thiết khổ ách.'],
      },
      {
        l: ['Xá lợi tử! Sắc bất dị không, không bất dị sắc, sắc tức thị không, không tức thị sắc,'],
      },
      {
        l: ['thọ, tưởng, hành, thức, diệc phục như thị.'],
      },
      {
        l: ['Xá lợi tử! Thị chư pháp không tướng, bất sanh, bất diệt, bất cấu, bất tịnh, bất tăng, bất giảm.'],
      },
      {
        l: ['Thị cố không trung vô sắc, vô thọ, tưởng, hành, thức,'],
      },
      {
        l: ['vô nhãn, nhĩ, tỷ, thiệt, thân, ý; vô sắc, thinh, hương, vị, xúc, pháp;'],
      },
      {
        l: ['Vô nhãn giới, nãi chí vô ý thức giới,'],
      },
      {
        l: [
          'vô vô minh diệc, vô vô minh tận, nãi chí vô lão tử, diệc vô lão tử tận, vô khổ, tập, diệt, đạo; vô trí diệc vô đắc.',
        ],
      },
      {
        l: ['Dĩ vô sở đắc cố, Bồ đề tát đỏa y bát nhã ba la mật đa cố, tâm vô quái ngại;'],
      },
      {
        l: ['vô quái ngại cố, vô hữu khủng bố, viễn ly điên đảo mộng tưởng, cứu cánh Niết bàn.'],
      },
      {
        l: ['Tam thế chư Phật, y Bát nhã ba la mật đa cố, đắc A nậu đa la tam miệu tam bồ đề.'],
      },
      {
        l: [
          'Cố tri Bát nhã ba la mật đa, thị đại thần chú, thị đại minh chú, thị vô thượng chú, thị vô đẳng đẳng chú, năng trừ nhất thiết khổ, chân thiệt bất hư Cố thuyết Bát nhã ba la mật đa chú, tức thuyết chú viết:',
        ],
      },
      {
        l: ['Yết-đế yết-đế, ba-la yết-đế, ba-la-tăng yết-đế, bồ-đề tát bà ha.'],
        m: 1,
      },
    ],
  },
  'dai-bi': {
    title: 'Chú Đại Bi',
    kind: 'chu',
    paras: [
      {
        l: ['Nam mô Đại bi Hội thượng Phật Bồ tát.'],
      },
      {
        l: ['Thiên thủ thiên nhãn vô ngại đại bi tâm đà la ni.'],
      },
      {
        l: ['Nam mô hắc ra đát na đa ra dạ da. Nam mô a rị đa, bà lô kiết đế, thước bát ra da'],
        m: 1,
      },
      {
        l: ['Bồ đề tát đỏa bà da, ma ha tát đỏa bà da, ma ha ca lô ni ca da'],
        m: 1,
      },
      {
        l: ['Án, tát bàn ra phạt duệ, số đát na đát tỏa'],
        m: 1,
      },
      {
        l: [
          'Nam mô tất kiết lật đỏa, y mông a rị da, bà lô kiết đế, thất Phật ra lăng đà bà. Nam mô na ra cẩn trì hê rị',
        ],
        m: 1,
      },
      {
        l: ['ma ha bàn đa sa mế'],
        m: 1,
      },
      {
        l: ['tát bà a tha đậu du bằng, a thệ dựng, tát bà tát đa'],
        m: 1,
      },
      {
        l: ['na ma bà dà, ma phạt đạt đậu'],
        m: 1,
      },
      {
        l: ['đát điệt tha Án, a bà lô hê, lô ca đế'],
        m: 1,
      },
      {
        l: ['ca ra đế, di hê rị, ma ha Bồ đề tát đỏa, tát bà tát bà, ma ra ma ra'],
        m: 1,
      },
      {
        l: ['ma hê ma hê, rị đà dựng, cu lô cu lô kiết mông'],
        m: 1,
      },
      {
        l: ['độ lô độ lô, phạt xà da đế, ma ha phạt xà da đế, đà ra đà ra, địa rị ni, thất Phật ra da'],
        m: 1,
      },
      {
        l: ['dá ra dá ra. Mạ mạ phạt ma ra, mục đế lệ'],
        m: 1,
      },
      {
        l: ['y hê di hê, thất na thất na, a ra sâm Phật ra xá lợi, phạt sa phạt sâm, Phật ra xá da'],
        m: 1,
      },
      {
        l: ['hô lô hô lô, ma ra, hô lô hô lô, hê rị'],
        m: 1,
      },
      {
        l: ['ta ra ta ra, tất rị tất rị, tô rô tô rô, Bồ đề dạ Bồ đề dạ, bồ đà dạ, bồ đà dạ'],
        m: 1,
      },
      {
        l: ['di đế rị dạ, na ra cẩn trì địa rị sắc ni na, ba dạ ma na, ta bà ha. Tất đà dạ ta bà ha'],
        m: 1,
      },
      {
        l: ['Ma ha tất đà dạ ta bà ha. Tất đà dủ nghệ thất bàn ra dạ, ta bà ha. Na ra cẩn trì, ta bà ha'],
        m: 1,
      },
      {
        l: ['Ma ra na ra, ta bà ha. Tất ra tăng a mục khê da, ta bà ha. Ta bà ma ha, a tất đà dạ, ta bà ha'],
        m: 1,
      },
      {
        l: ['Giả kiết ra a tất đà dạ, ta bà ha. Ba đà ma yết tất đà dạ, ta bà ha'],
        m: 1,
      },
      {
        l: ['Na ra cẩn trì bàn dà ra dạ, ta bà ha. Ma bà lợi thắng kiết ra dạ, ta bà ha'],
        m: 1,
      },
      {
        l: ['Nam mô hắc ra đát na, đa ra dạ da. Nam mô a rị da bà lô kiết đế, thước bàn ra dạ, ta bà ha'],
        m: 1,
      },
      {
        l: ['Án, tất điện đô, mạn đa ra, bạt đà dạ, ta bà ha.'],
        m: 1,
      },
    ],
  },
  'a-di-da': {
    title: 'Kinh A Di Đà',
    kind: 'kinh',
    paras: [
      {
        l: ['Nam Mô Liên Trì Hải Hội Phật Bồ Tát.'],
      },
      {
        l: [
          'Như thị ngã văn: Nhất thời Phật tại Xá vệ quốc, Kỳ thọ Cấp cô độc viên, dữ đại Tỳ kheo tăng, thiên nhị bá ngũ thập nhân câu, giai thị đại A la hán, chúng sở tri thức:',
        ],
        vi: [
          'Như vậy tôi nghe: Một thuở nọ, Phật ở nước Xá-vệ, vườn Kỳ-thọ Cấp-cô-độc, cùng với đại Tỳ-kheo 1250 vị cùng ở chung, đều là bậc đại A-la-hán, mọi người đều biết đến.',
        ],
      },
      {
        l: [
          'Trưởng lão Xá lợi phất, Ma ha Mục kiền liên, Ma ha Ca diếp, Ma ha Ca chiên diên, Ma ha Câu hy la, Li bà đa, Châu lợi bàn đà dà, Nan đà, A nan đà, La hầu la, Kiều phạm ba đề, Tân đầu lô phả la đọa, Ca lưu đà di, Ma ha Kiếp tân na, Bạc câu la, A nâu lâu đà, như thị đẳng chư đại đệ tử,',
        ],
        vi: [
          'Đó là Trưởng lão Xá-lợi-phất, Ma-ha Mục-kiền-liên, Ma-ha Ca-diếp, Ma-ha Ca-chiên-diên, Ma-ha Câu-hy-la, Ly-bà-đa, Châu-lợi-bàn-đà-dà, Nan-đà, A-nan-đà, La-hầu-la, Kiều-phạm-ba-đề, Tân-đầu-Lô phả-la-đọa, Ca-lưu-đà-ni, Ma-ha Kiếp-tân-na, Bạc-câu-la, A-nậu-lâu-đà, và các vị đệ tử lớn như vậy nhiều nữa;',
        ],
      },
      {
        l: [
          'tinh chư Bồ tát ma ha tát. Văn thù Sư lợi pháp vương tử, A dật đa Bồ tát, Càng đà ha đề Bồ tát, Thường tinh tấn Bồ tát, dữ như thị đẳng, chư đại Bồ tát; cập Thích đề hoàn nhân đẳng, vô lượng chư thiên, đại chúng câu.',
        ],
        vi: [
          'cùng các vị Bồ-tát Ma-ha-tát như Văn-thù-sư-lợi Pháp vương tử, A-dật-đa Bồ-tát, Càn-đà-ha-đề Bồ-tát, Thường-Tinh-Tấn Bồ-tát và các vị Bồ-tát lớn nhiều như thế nữa; cùng với Thích-đề-hoàn-nhân v.v. vô lượng chư thiên đại chúng đồng câu hội.',
        ],
      },
      {
        l: [
          'Nhĩ thời Phật cáo Trưởng lão Xá lợi phất: Tùng thị Tây phương quá thập vạn ức Phật độ, hữu thế giới danh viết Cực lạc kỳ độ hữu Phật hiệu A di đà, kim hiện tại thuyết pháp. Xá lợi phất! Bỉ độ hà cố danh vi Cực lạc? Kỳ quốc chúng sanh vô hữu chúng khổ, đản thọ chư lạc, cố danh Cực lạc.',
        ],
        vi: [
          'Bấy giờ đức Phật bảo Trưởng lão Xá-lợi-phất: “Từ đây qua phương Tây cách 10 vạn ức cõi Phật, có một thế giới tên là Cực-Lạc, nước ấy có Phật hiệu là A-di-đà hiện đang thuyết pháp ở đó. Này Xá-lợi-phất! Vì sao gọi nước kia tên là Cực-Lạc? Vì chúng sanh của nước ấy không có các khổ não, chỉ hưởng những điều vui, cho nên gọi là Cực-Lạc.',
        ],
      },
      {
        l: [
          'Hựu Xá lợi phất! Cực lạc quốc độ, thất trùng lan thuẫn, thất trùng la võng, thất trùng hàng thọ, giai thị tứ bảo, châu tráp vi nhiễu, thị cố bỉ quốc danh vi Cực lạc.',
        ],
        vi: [
          'Lại này Xá-lợi-phất! Cõi nước Cực-Lạc có 7 lớp lan thuẩn, 7 lớp lưới giăng, 7 lớp hàng cây đều bằng 4 thứ báu vây quanh giáp vòng, cho nên nước ấy tên là Cực-Lạc.',
        ],
      },
      {
        l: [
          'Hựu Xá lợi phất! Cực lạc quốc độ, hữu thất bảo trì, bát công đức thủy, sung mãn kỳ trung, trì để thuần dĩ kim sa bố địa, Tứ biên giai đạo, kim ngân, lưu ly, pha lê hiệp thành; thượng hữu, lâu các, diệc dĩ kim, ngân, lưu ly, pha lê, xa cừ, xích châu, mã não nhi nghiêm sức chi.',
        ],
        vi: [
          'Lại này Xá-lợi-phất! Cõi nước Cực-Lạc có ao 7 báu, nước 8 công đức tràn đầy trong đó. Đáy ao toàn trải cát bằng vàng. Thềm đường 4 phía do vàng, bạc, lưu ly, pha lê hợp thành. Bên trên có lầu có các, cũng dùng đủ loại vàng, bạc, lưu ly, pha lê, xa cừ, xích châu, mã não để trang sức.',
        ],
      },
      {
        l: [
          'Trì chung liên hoa, đại như xa luân, thanh sắc thanh quang, huỳnh sắc huỳnh quang, xích sắc xích quang, bạch sắc bạch quang, vi diệu hương khiết. Xá lợi phất! Cực lạc quốc độ thành tựu như thị công đức trang nghiêm.',
        ],
        vi: [
          'Hoa sen trong ao lớn như bánh xe, màu xanh có ánh sáng xanh, màu vàng có ánh sáng vàng, màu đỏ có ánh sáng đỏ, màu trắng có ánh sánh trắng, thơm ngát vi diệu. Này Xá-lợi-phất, cõi nước Cực-Lạc thành tựu công đức trang nghiêm như thế!',
        ],
      },
      {
        l: [
          'Hựu Xá lợi phất! Bỉ Phật quốc độ thường tác thiên nhạc, huỳnh kim vi địa, trú dạ lục thời, vũ thiên mạn đà la hoa, kỳ độ chúng sanh thường dĩ thanh đán, các dĩ y kích thạnh chúng diệu hoa cúng dường tha phương thập vạn ức Phật, tức dĩ thực thời hoàn đáo bổn quốc, phạn thực kinh hành. Xá lợi phất! Cực lạc quốc độ thành tựu như thị công đức trang nghiêm.',
        ],
        vi: [
          'Lại này Xá-lợi-phất, cõi nước Phật kia, thường trổi nhạc trời, vàng ròng làm đất, ngày đêm 6 thời, mưa hoa Mạn-đà-la cõi trời. Chúng sanh ở cõi ấy, cứ mỗi sáng sớm, thường dùng đãy y, đựng các hoa đẹp, đem cúng dường 10 vạn ức Phật ở phương khác, vừa đến giờ ăn, trở về nước mình, ăn cơm, kinh hành. Này Xá-lợi-phất, cõi nước Cực-Lạc thành tựu công đức trang nghiêm như thế!',
        ],
      },
      {
        l: [
          'Phục thứ Xá lợi phất! Bỉ quốc thường hữu chủng chủng kỳ diệu, tạp sắc chi điểu: Bạch hạc, Khổng tước, Anh vũ, Xá lợi, Ca lăng tần già, Cộng mạng chi điểu, thị chư chúng điểu, trú dạ lục thời, xuất hòa nhã âm, kỳ âm diễn xướng: ngũ căn, ngũ lực, thất bồ đề phần, bát thánh đạo phần, như thị đẳng pháp, kỳ độ chúng sanh văn thị âm dĩ, giai tất niệm Phật, niệm Pháp, niệm Tăng.',
        ],
        vi: [
          'Lại này nữa Xá-lợi-phất, cõi nước kia thường có các loài chim mầu sắc kỳ diệu, như Bạch Hạc, Khổng Tước, Anh Vũ, Xá-lợi, Ca-lăng-tần-già, Cộng Mạng. Những thứ chim này, ngày đêm 6 thời, hót lên tiếng hòa nhã, tiếng ấy diễn xướng 5 căn, 5 lực, 7 Bồ-đề phần, 8 thánh đạo phần. Các pháp như thế ấy, chúng sanh ở nước kia nghe âm thanh này rồi, thảy đều niệm Phật, niệm Pháp, niệm Tăng!',
        ],
      },
      {
        l: [
          'Xá lợi phất, nhữ vật vị thử điểu, thiệt thị tội báo sở sanh. Sở dĩ giả hà? Bỉ Phật quốc độ vô tam ác đạo. Xá lợi phất! Kỳ Phật quốc độ thượng vô tam ác đạo chi danh, hà huống hữu thiệt, thị chư chúng điểu, giai thị A di đà Phật dục linh pháp âm tuyên lưu biến hóa sở tác.',
        ],
        vi: [
          'Này Xá-lợi-phất, ông chớ cho rằng chim này thiệt là do tội báo sanh ra. Tại sao thế? Vì cõi nước của Phật kia không có 3 ác đạo. Này Xá-lợi-phất, cõi nước của Phật kia còn không có tên của ác đạo, huống chi lại có thật. Các thứ chim ấy đều là do Phật A-di-đà muốn cho tiếng Pháp âm truyền khắp mà biến hóa ra như thế.',
        ],
      },
      {
        l: [
          'Xá lợi phất! Bỉ Phật quốc độ vi phong xuy động, chư bảo hàng thọ, cập bảo la võng, xuất vi diệu âm, thí như bá thiên chủng nhạc đồng thời cu tác, văn thị âm giả, tự nhiên giai sanh: niệm Phật, niệm Pháp, niệm Tăng chi tâm. Xá lợi phất! Kỳ Phật quốc độ, thành tựu, như thị công đức trang nghiêm.',
        ],
        vi: [
          'Này Xá-lợi-phất, cõi nước Phật kia, gió nhẹ lay động các hàng cây báu và các lưới báu, phát ra âm thanh vi diệu, giống như trăm nghìn thứ âm nhạc đồng trỗi một lượt. Ai nghe tiếng này rồi, tự nhiên đều sanh tâm niệm Phật, niệm Pháp, niệm Tăng. Này Xá-lợi-phất, cõi nước Phật kia thành tựu công đức trang nghiêm như thế.',
        ],
      },
      {
        l: [
          'Xá lợi phất! Ư nhữ ý vân hà? Bỉ Phật hà cố hiệu A di đà? Xá lợi phất! Bỉ Phật quang minh vô lượng, chiếu thập phương quốc, vô sở chướng ngại, thị cố hiệu vi A di đà. Hựu Xá lợi phất! Bỉ Phật thọ mạng, cập kỳ nhân dân, vô lượng vô biên a tăng kỳ kiếp, cố danh A di đà. Xá lợi phất! A di đà Phật thành Phật dĩ lai, ư kim thập kiếp.',
        ],
        vi: [
          'Này Xá-lợi-phất, ý ông nghĩ sao? Tại sao Đức Phật kia có tên là A-di-đà? Này Xá-lợi-phất, Đức Phật kia có ánh sáng vô lượng, chiếu suốt 10 phương cõi nước không bị chướng ngại, cho nên có tên là A-di-đà. Lại này Xá-lợi-phất, mạng sống của Phật kia và nhân dân của Ngài, vô lượng vô biên a-tăng-kỳ kiếp, cho nên có tên là A-di-đà. Này Xá-lợi-phất, Phật A-di-đà thành Phật đến nay đã 10 kiếp.',
        ],
      },
      {
        l: [
          'Hựu Xá lợi phất! Bỉ Phật hữu vô lượng vô biên Thanh văn đệ tử, giai A la hán, phi thị toán số chi sở năng tri; chư Bồ tát chúng diệc phục như thị. Xá lợi phất! Bỉ Phật quốc độ thành tựu như thị công đức trang nghiêm.',
        ],
        vi: [
          'Lại này Xá-lợi-phất, Đức Phật kia có vô lượng vô biên chúng đệ tử Thanh Văn đều là bực đại A-la-hán, không thể tính đếm mà biết được, các chúng Bồ-tát cũng nhiều như thế. Này Xá-lợi-phất, cõi nước Phật kia thành tựu công đức trang nghiêm như thế!',
        ],
      },
      {
        l: [
          'Hựu Xá lợi phất! Cực lạc quốc độ chúng sanh sanh giả, giai thị a bệ bạt trí, kỳ trung đa hữu nhất sanh bổ xứ, kỳ số thậm đa phi thị toán số, sở năng tri chi, đản khả dĩ vô lượng vô biên a tăng kỳ thuyết.',
        ],
        vi: [
          'Lại này Xá-lợi-phất, cõi nước Cực-Lạc, chúng sanh sanh về đều là bực A-bệ-bạt-trí. Trong đó có nhiều vị Nhất sanh bổ xứ. Số đó nhiều đến nỗi không thể tính đếm mà biết được, chỉ có dùng số vô lượng vô biên a-tăng-kỳ để nói.',
        ],
      },
      {
        l: [
          'Xá lợi phất! Chúng sanh văn giả, ưng đương phát nguyện, nguyện sanh bỉ quốc. Sở dĩ giả hà? Đắc dữ như thị chư thượng thiện nhân câu hội nhất xứ. Xá lợi phất! Bất khả dĩ thiểu thiện căn phước đức nhân duyên, đắc sanh bỉ quốc.',
        ],
        vi: [
          'Này Xá-lợi-phất, chúng sanh nghe được những điều này, phải nên phát nguyện, nguyện sanh về nước kia. Tại sao thế? Vì được ở cùng một chỗ với các bậc Thượng thiện nhân. Này Xá-lợi-phất, không nên cho rằng có chút ít nhân duyên phước đức căn lành mà được sanh về nước kia đâu.',
        ],
      },
      {
        l: [
          'Xá lợi phất! Nhược hữu thiện nam tử, thiện nữ nhân, văn thuyết A di đà Phật, chấp trì danh hiệu, nhược nhất nhật, nhược nhị nhật, nhược tam nhật, nhược tứ nhật, nhược ngũ nhật, nhược lục nhật, nhược thất nhật, nhất tâm bất loạn. Kỳ nhân lâm mạng chung thời, A di đà Phật dữ chư Thánh chúng, hiện tại kỳ tiền, thị nhân chung thời, tâm bất điên đảo, tức đắc vãng sanh A di đà Phật Cực lạc quốc độ. Xá lợi phất! Ngã kiến thị lợi, cố thuyết thử ngôn, nhược hữu chúng sanh văn thị thuyết giả, ưng đương phát nguyện, sanh bỉ quốc độ.',
        ],
        vi: [
          'Này Xá-lợi-phất, nếu có hàng thiện nam thiện nữ nào nghe nói về Phật A-di-đà rồi chấp trì danh hiệu Ngài, hoặc 1 ngày, 2 ngày, 3 ngày, 4 ngày, 5 ngày, 6 ngày, 7 ngày, nhất tâm bất loạn. Người ấy khi lâm chung thấy Phật A-di-đà cùng các Thánh chúng hiện ra trước mặt. Khi chết người ấy tâm không điên đảo, liền được vãng sanh về thế giới Cực-Lạc của Phật A-di-đà. Này Xá-lợi-phất. ta thấy những điều lợi ấy nên mới nói như vậy. Nếu có chúng sinh nào nghe ta nói đây, phải nên phát nguyện sanh về nước kia.',
        ],
      },
      {
        l: [
          'Xá lợi phất! Như ngã kim giả, tán thán A di đà Phật bất khả tư nghị công đức chi lợi. Đông phương diệc hữu A súc bệ Phật, Tu di tướng Phật, Đại Tu di Phật, Tu di Quang Phật, Diệu Âm Phật; như thị đẳng hằng hà sa số chư Phật, các ư kỳ quốc, xuất quảng trường thiệt tướng, biến phú tam thiên đại thiên thế giới, thuyết thành thiệt ngôn: “Nhữ đẳng chúng sanh đương tín thị xưng tán bất khả tư nghị công đức nhất thiết chư Phật sở hộ niệm kinh”.',
        ],
        vi: [
          'Này Xá-lợi-phất, như ta hôm nay ngợi khen lợi ích về công đức không thể nghĩ bàn của Phật A-di-đà. Ở phương Đông cũng có Phật A-súc-bệ, Phật Tu-di Tướng, Phật Đại Tu-di, Phật Tu-di Quang, Phật Diệu Âm. Giống như vậy hằng hà sa số chư Phật, mỗi vị đều ở cõi nước của mình, hiện ra tướng lưỡi rộng dài trùm khắp cả tam thiên đại thiên thế giới, nói lời thành thật như vầy: Chúng sanh các ngươi phải nên tin vào công đức khen ngợi không thể nghĩ bàn và “Kinh được tất cả chư Phật hộ niệm” này.',
        ],
      },
      {
        l: [
          'Xá lợi phất! Nam phương thế giới hữu Nhật Nguyệt Đăng Phật, Danh Văn Quang Phật, Đại Diệm Kiên Phật, Tu di Đăng Phật, Vô Lượng Tinh Tấn Phật; như thị đẳng hằng hà sa số chư Phật, các ư kỳ quốc, xuất quảng trường thiệt tướng, biến phú tam thiên đại thiên thế giới, thuyết thành thiệt ngôn: “Nhữ đẳng chúng sanh đương tín thị, xưng tán bất khả tư nghị công đức nhất thiết chư Phật sở hộ niệm kinh”.',
        ],
        vi: [
          'Này Xá-lợi-phất, ở thế giới phương Nam có Phật Nhật Nguyệt Đăng, Phật Danh Văn Quang, Phật Đại Diệm Kiên, Phật Tu-di Đăng, Phật Vô Lượng Tinh Tấn. Giống như vậy hằng hà sa số chư Phật, mỗi vị đều ở cõi nước của mình, hiện ra tướng lưỡi rộng dài trùm khắp cả tam thiên đại thiên thế giới, nói lời thành thật như vầy: Chúng sanh các ngươi phải tin vào công đức khen ngợi không thể nghĩ bàn và “Kinh được tất cả chư Phật hộ niệm” này.',
        ],
      },
      {
        l: [
          'Xá lợi phất! Tây Phương thế giới hữu Vô Lượng Thọ Phật, Vô Lượng Tướng Phật, Vô Lượng Tràng Phật, Đại Quang Phật, Đại Minh Phật, Bảo Tướng Phật, Tịnh Quang Phật; như thị đẳng hằng hà sa số chư Phật, các ư kỳ quốc, xuất quảng trường thiệt tướng, biến phú tam thiên đại thiên thế giới, thuyết thành thiệt ngôn: “Nhữ đẳng chúng sanh đương tín thị, xưng tán bất khả tư nghị công đức nhất thiết chư Phật sở hộ niệm kinh”.',
        ],
        vi: [
          'Này Xá-lợi-phất, ở thế giới phương Tây có Phật Vô Lượng Thọ, Phật Vô Lượng Tướng, Phật Đại Quang, Phật Đại Minh, Phật Bảo Tướng, Phật Tịnh Quang. Giống như vậy hằng hà sa số chư Phật, mỗi vị đều ở cõi nước của mình, hiện ra tướng lưỡi rộng dài trùm khắp cả tam thiên đại thiên thế giới, nói lời thành thật như vầy: Chúng sanh các ngươi phải tin vào công đức khen ngợi không thể nghĩ bàn và “Kinh được tất cả chư Phật hộ niệm” này.',
        ],
      },
      {
        l: [
          'Xá lợi phất! Bắc phương thế giới, hữu Diệm Kiên Phật, Tối Thắng Âm Phật, Nan Thơ Phật, Nhật Sanh Phật, Võng Minh Phật; như thị đẳng hằng hà sa số chư Phật, các ư kỳ quốc, xuất quảng trường thiệt tướng, biến phú tam thiên đại thiên thế giới, thuyết thành thiệt ngôn: “Nhữ đẳng chúng sanh đương tín thị, xưng tán bất khả tư nghị công đức nhất thiết chư Phật sở hộ niệm kinh”.',
        ],
        vi: [
          'Này Xá-lợi-phất, ở thế giới phương Bắc có Phật Diệm Kiên, Phật Tối Thắng Âm, Phật Nan Trở, Phật Nhật Sanh, Phật Võng Minh. Giống như vậy hằng hà sa số chư Phật, mỗi vị đều ở cõi nước của mình, hiện ra tướng lưỡi rộng dài trùm khắp cả tam thiên đại thiên thế giới, nói lời thành thật như vầy: Chúng sanh các ngươi phải tin vào công đức khen ngợi không thể nghĩ bàn và “Kinh được tất cả chư Phật hộ niệm” này.',
        ],
      },
      {
        l: [
          'Xá lợi phất! Hạ phương thế giới, hữu Sư Tử Phật, Danh Văn Phật, Danh Quang Phật, Đạt ma Phật, Pháp Tràng Phật, Trì Pháp Phật; như thị đẳng hằng hà sa số chư Phật, các ư kỳ quốc, xuất quảng trường thiệt tướng, biến phú tam thiên đại thiên thế giới, thuyết thành thiệt ngôn: “Nhữ đẳng chúng sanh đương tín thị, xưng tán bất khả tư nghị công đức nhất thiết chư Phật sở hộ niệm kinh”.',
        ],
        vi: [
          'Này Xá-lợi-phất, thế giới phương Dưới có Phật Sư Tử, Phật Danh Văn, Phật Danh Quang, Phật Đạt-ma, Phật Pháp Tràng, Phật Trì Pháp. Giống như vậy hằng hà sa số chư Phật, mỗi vị đều ở cõi nước của mình, hiện ra tướng lưỡi rộng dài trùm khắp cả tam thiên đại thiên thế giới, nói lời thành thật như vầy: Chúng sanh các ngươi phải tin vào công đức khen ngợi không thể nghĩ bàn, và “Kinh được tất cả chư Phật hộ niệm” này.',
        ],
      },
      {
        l: [
          'Xá lợi phất! Thượng phương thế giới, hữu Phạm Âm Phật, Tú Vương Phật, Hương Thượng Phật, Hương Quang Phật, Đại Diệm Kiên Phật, Tạp Sắc Bảo Hoa Nghiêm Thân Phật, Ta la thọ Vương Phật, Bảo Hoa Đức Phật, Kiến Nhất Thiết Nghĩa Phật, Như Tu di Sơn Phật; như thị đẳng hằng hà sa số chư Phật, các ư kỳ quốc, xuất quảng trường thiệt tướng, biến phú tam thiên đại thiên thế giới, thuyết thành thiệt ngôn: “Nhữ đẳng chúng sanh đương tín thị, xưng tán bất khả tư nghị công đức nhất thiết chư Phật sở hộ niệm kinh”.',
        ],
        vi: [
          'Này Xá-lợi-phất, ở thế giới phương Trên có Phật Phạm Âm, Phật Tú Vương, Phật Hương Thượng, Phật Hương Quang, Phật Đại Diệm Kiên, Phật Tạp Sắc Bảo Hoa Nghiêm Thân, Phật Ta-la-thọ Vương, Phật Bảo Hoa Đức, Phật Kiến Nhất Thiết Nghĩa, Phật Tu-di Sơn. Giống như vậy hằng hà sa số chư Phật, mỗi vị đều ở cõi nước của mình, hiện ra tướng lưỡi rộng dài trùm khắp cả tam thiên đại thiên thế giới, nói lời thành thật như vầy: Chúng sanh các ngươi phải tin vào công đức khen ngợi không thể nghĩ bàn, và “Kinh được tất cả chư Phật hộ niệm” này.',
        ],
      },
      {
        l: [
          'Xá lợi phất! “Ư nhữ ý vân hà? Hà cố danh vi: Nhất thiết chư Phật sở hộ niệm kinh”? Xá lợi phất! Nhược hữu thiện nam tử, thiện nữ nhân văn thị kinh thọ trì giả, cập văn chư Phật danh giả, thị chư thiện nam tử, thiện nữ nhân, giai vi nhất thiết chư Phật chi sở hộ niệm, giai đắc bất thối chuyển ư A nậu đa la Tam miệu tam bồ đề. Thị cố Xá lợi phất! Nhữ đẳng giai đương tín thọ ngã ngữ, cập chư Phật sở thuyết.',
        ],
        vi: [
          'Này Xá-lợi-phất, ý của ông nghĩ sao? Tại sao gọi là “Kinh được tất cả chư Phật hộ niệm”? Này Xá-lợi-phất, nếu có kẻ thiện nam người thiện nữ nào nghe Kinh này mà thọ trì, và nghe được danh hiệu của chư Phật, thì những thiện nam thiện nữ ấy đều được tất cả chư Phật hộ niệm cho và đều được không thối chuyển nơi đạo Vô thượng Chánh đẳng Chánh giác. Cho nên này Xá-lợi-phất, các ông hãy nên tin nhận lời ta và lời chư Phật nói.',
        ],
      },
      {
        l: [
          'Xá lợi phất! Nhược hữu nhân dĩ phát nguyện, kim phát nguyện, đương phát nguyện, dục sanh A di đà Phật quốc giả, thị chư nhân đẳng giai đắc bất thối chuyển ư a nậu đa la tam miệu tam bồ đề, ư bỉ quốc độ nhược dĩ sanh, nhược kim sanh, nhược đương sanh. Thị cố Xá lợi phất! Chư thiện nam tử, thiện nữ nhân, nhược hữu tín giả, ưng đương phát nguyện sanh bỉ quốc độ.',
        ],
        vi: [
          'Này Xá-lợi-phất, nếu có người đã phát nguyện, đang phát nguyện, sẽ phát nguyện muốn sanh về nước của Phật A-di-đà thì những người đó đều được không thối chuyển nơi đạo Vô thượng Chánh đẳng Chánh giác. Ở nước Phật kia, những người này hoặc đã sanh, hoặc đang sanh về, hoặc sẽ sanh. Cho nên này Xá-lợi-phất, các thiện nam tử thiện nữ nhân, nếu ai có lòng tin hãy nên phát nguyện sanh về cõi nước kia.',
        ],
      },
      {
        l: [
          'Xá lợi phất! Như ngã kim giả, xưng tán chư Phật bất khả tư nghị công đức, bỉ chư Phật đẳng, diệc xưng tán ngã bất khả tư nghị công đức nhi tác thị ngôn: “Thích ca Mâu ni Phật năng vi thậm nan hy hữu chi sự, năng ư Ta bà quốc độ ngũ trược ác thế; kiếp trược, kiến trược, phiền não trược, chúng sanh trược, mạng trược trung đắc A nậu đa la Tam miệu tam bồ đề, vị chư chúng sanh, thuyết thị nhất thiết thế gian nan tín chi pháp.”',
        ],
        vi: [
          'Này Xá-lợi-phất, như ta hôm nay khen ngợi công đức không thể nghĩ bàn của chư Phật, các Đức Phật kia cũng ngợi khen công đức không thể nghĩ bàn của ta và nói như thế nầy: Đức Phật Thích Ca Mâu Ni đã làm được những việc rất khó làm và ít có; ở trong cõi nước Ta Bà, trong đời ác 5 trược: Kiếp trược, Kiến trược, Phiền não trược, Chúng sanh trược, Mạng trược được quả A-nậu-đa-la Tam-miệu-tam-bồ-đề. Ngài giảng cho các chúng sanh nghe pháp tất cả thế gian khó tin này.',
        ],
      },
      {
        l: [
          'Xá lợi phất! Đương tri ngã ư ngũ trược ác thế, hành thử nan sự, đắc A nậu đa la Tam miệu tam bồ đề, vị nhất thiết thế gian thuyết thử nan tín chi pháp, thị vi thậm nan. Phật thuyết thử kinh dĩ, Xá lợi phất cập chư Tỳ kheo, nhất thiết thế gian, Thiên, nhân, A tu la đẳng, văn Phật sở thuyết, hoan hỷ tín thọ, tác lễ nhi khứ.',
        ],
        vi: [
          'Này Xá-lợi-phất, nên biết ta ở đời ác 5 trược làm việc khó làm này, được quả A-nậu-đa-la Tam-miệu-tam-bồ-đề, nói cho tất cả thế gian pháp khó tin này, thật là rất khó! Phật nói Kinh này rồi, ngài Xá-lợi-phất và các Tỳ-kheo, tất cả người, trời, A-tu-la... ở thế gian nghePhật nói rồi đều hoan hỉ tin nhận, lễ Phật mà lui ra.',
        ],
      },
    ],
  },
  'pho-mon': {
    title: 'Phẩm Phổ Môn',
    kind: 'kinh',
    paras: [
      {
        l: [
          'Nhĩ thời, Vô tận ý Bồ tát tức tùng tọa khởi, thiên đản hữu kiên, hiệp chưởng hướng Phật, nhi tác thị ngôn: Thế Tôn, Quán thế âm Bồ tát dĩ hà nhân duyên danh Quán thế âm?',
        ],
        vi: [
          'Lúc bấy giờ ngài Vô-Tận-Ý Bồ-tát liền từ chỗ ngồi đứng dậy trịch áo bày vai hữu, chắp tay hướng Phật mà bạch rằng: “Thế Tôn! Ngài Quán-Thế-Âm Bồ-tát do nhân duyên gì mà tên là Quán-Thế-Âm?”',
        ],
      },
      {
        l: [
          'Phật cáo Vô tận ý Bồ tát: Thiện nam tử, nhược hữu vô lượng bá thiên vạn ức chúng sanh, thọ chư khổ não, văn thị Quán thế âm Bồ tát nhất tâm xưng danh, Quán thế âm Bồ tát, tức thời quán kỳ âm thanh giai đắc giải thoát.',
        ],
        vi: [
          'Phật bảo ngài Vô-Tận-Ý Bồ-tát: “Thiện nam tử! Nếu có vô lượng trăm nghìn muôn ức chúng sinh chịu các khổ não, nghe Quán-Thế-Âm Bồ-tát này một lòng xưng danh. Quán-Thế-Âm Bồ-tát tức thời xem xét tiếng tăm kia, đều đưọc giải thoát.',
        ],
      },
      {
        l: [
          'Nhược hữu trì thị Quán thế âm Bồ tát danh giả, thiết nhập đại hỏa, hỏa bất năng thiêu; do thị Bồ tát, oai thần lực cố. Nhược vị đại thủy sở phiêu, xưng kỳ danh hiệu tức đắc thiển xứ.',
        ],
        vi: [
          'Nếu có người trì danh hiệu Quán-Thế-Âm Bồ-tát này, dầu vào trong lửa lớn, lửa chẳng cháy được, vì do sức uy thần của Bồ-tát này được như vậy. Nếu bị nước lớn làm trôi, xưng danh hiệu Bồ-tát này liền được chỗ cạn.',
        ],
      },
      {
        l: [
          'Nhược hữu bá thiên vạn ức chúng sanh, vị cầu: kim ngân, lưu ly, xa cừ, mã não, san hô, hổ phách, trân châu, đẳng bảo, nhập ư đại hải; giả sử hắc phong xuy kỳ thuyền phưởng, phiêu đọa La sát quỷ quốc, kỳ trung nhược hữu nãi chí nhất nhân, xưng Quán thế âm Bồ tát danh giả, thị chư nhân đẳng giai đắc giải thoát La sát chi nạn. Dĩ thị nhân duyên, danh Quán thế âm.',
        ],
        vi: [
          'Nếu có trăm nghìn muôn ức chúng sanh vì tìm vàng, bạc, lưu ly, xa cừ, mã não, san hô, hổ phách, trân châu các thứ báu, vào trong biển lớn, giả sử gió lớn thổi ghe thuyền của kia trôi tắp nơi nước quỷ La-sát, trong ấy nếu có nhẫn đến một người xưng danh hiệu Quán-Thế-Âm Bồ-tát, thời các người đó đều được thoát khỏi nạn quỷ La-sát. Do nhân duyên đó mà tên là Quán-Thế-Âm.',
        ],
      },
      {
        l: [
          'Nhược phục hữu nhân, lâm đương bị hại, xưng Quán thế âm Bồ tát danh giả, bỉ sở chấp đao trượng, tầm đoạn đoạn hoại, nhi đắc giải thoát. Nhược tam thiên đại thiên quốc độ, mãn trung Dạ xoa, La sát, dục lai não nhân, văn kỳ xưng Quán thế âm Bồ tát danh giả, thị chư ác quỷ, thượng bất năng dĩ ác nhãn thị chi, huống phục gia hại. Thiết phục hữu nhân, nhược hữu tội, nhược vô tội, nữu giới già tỏa, kiểm hệ kỳ thân, xưng Quán thế âm Bồ tát danh giả, giai tất đoạn hoại tức đắc giải thoát.',
        ],
        vi: [
          'Nếu lại có người sắp bị hại, xưng danh hiệu Quán-Thế-Âm Bồ-tát, thời dao gậy của người cầm liền gãy từng khúc, người ấy được thoát khỏi. Nếu quỷ Dạ-xoa cùng La-sát đầy trong cõi tam thiên đại thiên muốn đến hại người, nghe người xưng hiệu Quán-Thế-Âm Bồ-tát, thời các quỷ dữ đó còn không thể dùng mắt dữ mà nhìn người, huống lại làm hại được. Dầu lại có người hoặc có tội, hoặc không tội, gông cùm xiềng xích trói buộc nơi thân, xưng danh hiệu Quán-Thế-Âm Bồ-tát thảy đều đứt rã, liền được thoát khỏi.',
        ],
      },
      {
        l: [
          'Nhược tam thiên đại thiên quốc độ, mãn trung oán tặc, hữu nhất thương chủ, tương chư thương nhân, tê trì trọng bảo kinh quá hiểm lộ, kỳ trung nhất nhân, tác thị xướng ngôn: “Chư thiện nam tử, vật đắc khủng bố, nhữ đẳng ưng đương nhất tâm xưng Quán thế âm Bồ tát danh hiệu; thị Bồ tát năng dĩ vô úy thí ư chúng sanh; nhữ đẳng nhược xưng danh giả, ư thử oán tặc, đương đắc giải thoát”. Chúng thương nhân văn, câu phát thinh ngôn: “Nam mô Quán thế âm Bồ tát” xưng kỳ danh cố, tức đắc giải thoát. Vô tận ý! Quán thế âm Bồ tát ma ha tát, oai thần chi lực, nguy nguy như thị.',
        ],
        vi: [
          'Nếu kẻ oán tặc đầy trong cõi tam thiên đại thiên, có một vị thương chủ dắt các người buôn đem theo nhiều của báu, trải qua nơi đường hiểm trở, trong đó có một người xướng rằng: “Các thiện nam tử! Chớ nên sợ sệt, các ông nên phải một lòng xưng danh hiệu Quán-Thế-Âm Bồ-tát, vị Bồ-tát đó hay đem pháp vô úy thí cho chúng sinh, các ông nếu xưng danh hiệu thời sẽ được thoát khỏi oán tặc này”. Các người buôn nghe rồi, đều lên tiếng xưng rằng: “Nam-mô Quán-Thế-Âm Bồ-tát!”, vì xưng danh hiệu Bồ-tát nên liền được thoát khỏi. Vô-Tận-Ý! Quán-Thế-Âm Bồ-tát sức oai thần to lớn như thế.',
        ],
      },
      {
        l: [
          'Nhược hữu chúng sanh đa ư dâm dục, thường niệm cung kính Quán thế âm Bồ tát tiện đắc ly dục; nhược đa sân nhuế, thường niệm cung kính Quán thế âm Bồ tát, tiện đắc ly sân; nhược đa ngu si, thường niệm cung kính Quán thế âm Bồ tát tiện đắc ly si. Vô tận ý! Quán thế âm Bồ tát, hữu như thị đẳng đại oai thần lực, đa sở nhiêu ích. Thị cố chúng sanh, thường ưng, tâm niệm.',
        ],
        vi: [
          'Nếu có chúng sinh nào nhiều lòng dâm dục, thường cung kính niệm Quán-Thế-Âm Bồ-tát, liền được ly dục. Nếu người nhiều giận hờn, thường cung kính niệm Quán-Thế-Âm Bồ-tát, liền được lìa lòng giận. Nếu người nhiều ngu si, thường cung kính niệm Quán-Thế-Âm Bồ-tát, liền được lìa ngu si. Vô-Tận-Ý! Quán-Thế-Âm Bồ-tát có những sức uy thần lớn, nhiều lợi ích như thế, cho nên chúng sinh thường phải một lòng tưởng nhớ.',
        ],
      },
      {
        l: [
          'Nhược hữu nữ nhân, thiết dục cầu nam, lễ bái cúng dường Quán thế âm Bồ tát, tiện sanh phước đức trí huệ chi nam; thiết dục cầu nữ, tiện sanh đoan chánh hữu tướng chi nữ, túc thực đức bổn, chúng nhân ái kính.',
        ],
        vi: [
          'Nếu có người nữ, giả sử muốn cầu con trai, lễ lạy cúng dường Quán-Thế-Âm Bồ-tát, liền sinh con trai phúc đức trí tuệ; giả sử muốn cầu con gái, bèn sinh con gái có tướng xinh đẹp, trước đã trồng gốc phúc đức, mọi người đều kính mến.',
        ],
      },
      {
        l: [
          'Vô tận ý! Quán thế âm Bồ tát hữu như thị lực, nhược hữu chúng sanh, cung kính lễ bái Quán thế âm Bồ tát, phước bất đường quyên, thị cố chúng sanh, giai ưng thọ trì Quán thế âm Bồ tát danh hiệu.',
        ],
        vi: [
          'Vô-Tận-Ý! Quán-Thế-Âm Bồ-tát có sức thần như thế. Nếu có chúng sinh cung kính lễ lạy Quán-Thế-Âm Bồ-tát, thời phúc đức chẳng luống mất. Cho nên chúng sinh đều phải thọ trì danh hiệu Quán-Thế-Âm Bồ-tát.',
        ],
      },
      {
        l: [
          'Vô tận ý! Nhược hữu nhân thọ trì lục thập nhị ức hằng hà sa Bồ tát danh tự, phục tận hình cúng dường ẩm thực, y phục, ngọa cụ, y dược, ư nhữ ý vân hà? Thị thiện nam tử, thiện nữ nhân công đức đa phủ?',
        ],
        vi: [
          'Vô-Tận-Ý! Nếu có người thọ trì danh hiệu của 62 ức hằng hà sa bồ tát lại trọn đời cúng dường đồ ăn uống y phục, giường nằm thuốc thang. Ý ông nghĩ sao? Công đức của người thiện nam tử, thiện nữ nhân đó có nhiều chăng?”',
        ],
      },
      {
        l: ['Vô tận ý ngôn: “Thậm đa, Thế Tôn”.'],
        vi: ['Vô-Tận-Ý thưa: “Bạch Thế Tôn! Rất nhiều”.'],
      },
      {
        l: [
          'Phật ngôn: “Nhược phục hữu nhân, thọ trì Quán thế âm Bồ tát danh hiệu, nãi chí nhất thời lễ bái, cúng dường, thị nhị nhân phước, chánh đẳng vô dị! ư bá thiên vạn ức kiếp, bất khả cùng tận. Vô tận ý, thọ trì Quán thế âm Bồ tát danh hiệu, đắc như thị vô lượng vô biên phước đức chi lợi”.',
        ],
        vi: [
          'Phật nói: “Nếu lại có người thọ trì danh hiệu Quán-Thế-Âm Bồ-tát, nhẫn đến một thời lễ lạy cúng dường, thời phúc của hai người đó bằng nhau không khác, trong trăm nghìn ức kiếp không thể cùng tận. Vô-Tận-Ý! Thọ trì danh hiệu Quán-Thế-Âm Bồ-tát được vô lượng vô biên phúc đức lợi ích như thế.”',
        ],
      },
      {
        l: [
          'Vô tận ý Bồ tát bạch Phật ngôn: Thế Tôn, Quán thế âm Bồ tát, vân hà du thử Ta bà thế giới? Vân hà nhi vị chúng sanh thuyết pháp? Phương tiện chi lực, kỳ sự vân hà?',
        ],
        vi: ['Ngài Vô-Tận-Ý Bồ-tát bạch Phật rằng: “Thế Tôn, Quán-Thế-Âm Bồ-tát dạo đi trong cõi Ta-bà như thế nào?”'],
      },
      {
        l: [
          'Phật cáo Vô tận ý Bồ tát: “Thiện nam tử, nhược hữu quốc độ chúng sanh, ưng dĩ Phật thân đắc độ giả, Quán thế âm Bồ tát tức hiện Phật thân nhi vị thuyết pháp;',
          'ưng dĩ Bích Chi Phật thân đắc độ giả, tức hiện Bích Chi Phật thân nhi vị thuyết pháp;',
          'ưng dĩ Thanh văn thân đắc độ giả, tức hiện Thanh văn thân nhi vị thuyết pháp;',
          'ưng dĩ Phạm Vương thân đắc độ giả, tức hiện Phạm Vương thân nhi vị thuyết pháp;',
          'ưng dĩ Đế Thích thân đắc độ giả, tức hiện Đế Thích thân, nhi vị thuyết pháp;',
          'ưng dĩ Tự tại Thiên thân đắc độ giả, tức hiện Tự tại Thiên thân nhi vị thuyết pháp;',
          'ưng dĩ Đại Tự tại Thiên thân đắc độ giả, tức hiện Đại Tự tại Thiên thân nhi vị thuyết pháp;',
          'ưng dĩ Thiên đại tướng quân thân đắc độ giả, tức hiện Thiên đại tướng quân thân nhi vị thuyết pháp;',
          'ưng dĩ Tỳ Sa Môn thân đắc độ giả, tức hiện Tỳ Sa Môn thân nhi vị thuyết pháp;',
          'ưng dĩ Tiểu Vương thân đắc độ giả, tức hiện Tiểu Vương thân nhi vị thuyết pháp;',
          'ưng dĩ Trưởng giả thân đắc độ giả, tức hiện Trưởng giả thân nhi vị thuyết pháp;',
          'ưng dĩ Cư sĩ thân đắc độ giả, tức hiện Cư sĩ thân nhi vị thuyết pháp;',
          'ưng dĩ Tể quan thân đắc độ giả, tức hiện Tể quan thân, nhi vị thuyết pháp;',
          'ưng dĩ Bà la môn thân đắc độ giả, tức hiện Bà la môn thân nhi vị thuyết pháp;',
          'ưng dĩ Tỳ kheo, Tỳ kheo ni, Ưu bà tắc, Ưu bà di thân đắc độ giả, tức hiện Tỳ kheo, Tỳ kheo ni, Ưu bà tắc, Ưu bà di thân nhi vị thuyết pháp;',
          'ưng dĩ Trưởng giả, Cư sĩ, Tể quan, Bà la môn, Phụ nữ thân đắc độ giả, tức hiện Phụ nữ thân nhi vị thuyết pháp;',
          'ưng dĩ Đồng nam, Đồng nữ thân đắc độ giả, tức hiện Đồng nam, Đồng nữ thân nhi vị thuyết pháp;',
          'ưng dĩ Thiên, Long, Dạ xoa, Càn thát bà, A tu la, Ca lầu la, Khẩn na la, Ma hầu la già, Nhân, Phi nhân đẳng thân đắc độ giả tức giai hiện chi nhi vị thuyết pháp;',
          'ưng dĩ Chấp kim cang thần đắc độ giả, tức hiện Chấp kim cang thần nhi vị thuyết pháp.',
        ],
        vi: [
          'Phật bảo Vô Tận Ý Bồ Tát: “Thiện nam tử! Nếu có chúng sinh trong quốc độ nào đáng dùng thân Phật được độ thoát thời Quán Thế Âm Bồ Tát liền hiện thân Phật vì đó nói pháp.',
          'Người đáng dùng thân Duyên Giác được độ thoát, liền hiện thân Duyên Giác mà vì đó nói pháp.',
          'Người đáng dùng thân Thanh Văn được độ thoát, liền hiện thân Thanh Văn mà vì đó nói pháp.',
          'Người đáng dùng thân Phạm Vương được độ thoát, liền hiện thân Phạm Vương mà vì đó nói pháp.',
          'Người đáng dùng thân Đế-thích được độ thoát, liền hiện thân Đế-thích mà vì đó nói pháp.',
          'Người đáng dùng thân Tự-Tại-Thiên được độ thoát, liền hiện thân Tự Tại-Thiên mà vì đó nói pháp.',
          'Người đáng dùng thân Đại Tự-Tại-Thiên được độ thoát, liền hiện thân Đại Tự-Tại-Thiên mà vì đó nói pháp.',
          'Người đáng dùng thân Thiên Đại Tướng Quân được độ thoát, liền hiện thân Thiên Đại Tướng Quân mà vì đó nói pháp.',
          'Người đáng dùng thân Tỳ-sa-môn được độ thoát, liền hiện thân Tỳ-sa-môn mà vì đó nói pháp.',
          'Người đáng dùng thân Tiểu Vương được độ thoát, liền hiện thân Tiểu Vương mà vì đó nói pháp.',
          'Người đáng dùng thân Trưởng Giả được độ thoát, liền hiện thân Trưởng Giả mà vì đó nói pháp.',
          'Người đáng dùng thân Cư Sĩ được độ thoát, liền hiện thân Cư Sĩ mà vì đó nói pháp.',
          'Người đáng dùng thân Tể Quan được độ thoát, liền hiện thân Tể Quan mà vì đó nói pháp.',
          'Người đáng dùng thân Bà-la-môn được độ thoát, liền hiện thân Bà-la-môn mà vì đó nói pháp.',
          'Người đáng dùng thân Tỳ-kheo, Tỳ-kheo-ni, Ưu-bà-tắc, Ưu-bà-di được độ thoát, liền hiện thân Tỳ-kheo, Tỳ-kheo-ni, Ưu-bà-tắc, Ưu-bà-di mà vì đó nói pháp.',
          'Người đáng dùng thân phụ nữ của Trưởng Giả, Cư Sĩ, Tể Quan, Bà La Môn được độ thoát, liền hiện thân phụ nữ mà vì đó nói pháp.',
          'Người đáng dùng thân đồng nam, đồng nữ được độ thoát, liền hiện thân đồng nam, đồng nữ mà vì đó nói pháp.',
          'Người đáng dùng thân Tròi, Rồng, Dạ-xoa, Càn-thát-bà, A-tu-la, Ca-lâu-la, Khẩn-na-la, Ma-hầu-la-dà, nhân cùng phi nhân được độ thoát, liền đều hiện ra mà vì đó nói pháp.',
          'Người đáng dùng thân Chấp Kim-cang Thần được độ thoát, liền hiện thân Chấp Kim-cang Thần mà vì đó nói pháp.',
        ],
      },
      {
        l: [
          'Vô tận ý! Thị Quán thế âm Bồ tát thành tựu như thị công đức dĩ chủng chủng hình, du chư quốc độ, độ thoát chúng sanh, thị cố nhữ đẳng, ưng đương nhất tâm cúng dường Quán thế âm Bồ tát. Thị Quán thế âm Bồ tát ma ha tát, ư bố úy cấp nạn chi trung, năng thí vô úy; thị cố thử Ta bà thế giới, giai hiệu chi vi thí vô úy giả.',
        ],
        vi: [
          'Vô-Tận-Ý! Quán-Thế-Âm Bồ-tát đó thành tựu công đức như thế, dùng các thân hình, dạo đi trong các cõi nước để độ thoát chúng sinh, cho nên các ông phải một lòng cúng dường Quán-Thế-Âm Bồ-tát. Quán-Thế-Âm Đại Bồ-tát đó ở trong chỗ nạn gấp sợ sệt hay ban sự vô úy, cho nên cõi Ta-bà này đều gọi Ngài là vị “Thí Vô Úy”.',
        ],
      },
      {
        l: [
          'Vô tận ý Bồ tát bạch Phật ngôn: “Thế Tôn! Ngã kim đương cúng dường Quán thế âm Bồ tát”. Tức giải cảnh chúng bảo châu anh lạc, giá trị bá thiên lượng kim, nhi dĩ dữ chi, tác thị ngôn: “Nhân giả thọ thử pháp thí, trân bảo anh lạc”. Thời Quán thế âm Bồ tát bất khẳng thọ chi. Vô tận ý phục bạch Quán thế âm Bồ tát ngôn: “Nhân giả mẫn ngã đẳng cố, thọ thử anh lạc”.',
        ],
        vi: [
          'Vô-Tận-Ý Bồ-tát bạch Phật: “Thế Tôn! Con nay phải cúng dường Quán-Thế-Âm Bồ-tát”. Liền mở chuỗi ngọc bằng các châu báu nơi cổ giá trị trăm nghìn lạng vàng, đem trao cho ngài Quán-Thế-Âm mà nói rằng: “Xin Ngài nhận chuỗi trân bảo pháp thí này”. Khi ấy Quán-Thế-Âm Bồ-tát chẳng chịu nhận chuỗi. Ngài Vô-Tận-Ý lại thưa cùng Quán-Thế-Âm Bồ-tát rằng: “Xin Ngài vì thương chúng tôi mà nhận chuỗi ngọc này”.',
        ],
      },
      {
        l: [
          'Nhĩ thời Phật cáo Quán thế âm Bồ tát: “Đương mẫn thử Vô tận ý Bồ tát cập tứ chúng: Thiên, Long, Dạ xoa, Càn thát bà, A tu la, Ca lâu la, Khẩn na la, Ma hầu la già, Nhân, Phi nhân đẳng cố, thọ thử anh lạc”. Tức thời Quán thế âm Bồ tát, mẫn chư tứ chúng, cập ư Thiên, Long, Nhân, Phi Nhân đẳng, thọ kỳ anh lạc, phân tác nhị phần: Nhất phần phụng Thích Ca Mâu Ni Phật, nhất phần phụng Đa bảo Phật tháp.',
        ],
        vi: [
          'Bấy giờ Phật bảo Quán-Thế-Âm Bồ-tát: “Ông nên thương Vô-Tận-Ý Bồ-tát này và hàng tứ chúng cùng Trời, Rồng, Dạ-xoa, Càn-thát-bà, A-tu-la, Ca-lâu-la, Khẩn-na-la, Ma-hầu-la-dà, nhân và phi nhân v.v... mà nhận chuỗi ngọc đó”. Tức thời Quán-Thế-Âm Bồ-tát thương hàng tứ chúng và Trời, Rồng, nhân, phi nhân v.v... mà nhận chuỗi ngọc đó chia làm 2 phần: một phần dâng đức Thích-ca Mâu-ni Phật, một phần dâng tháp của Phật Đa Bảo.',
        ],
      },
      {
        l: [
          'Vô tận ý, Quán thế âm Bồ tát hữu như thị tự tại thần lực du ư Ta bà thế giới. Nhĩ thời Vô tận ý Bồ tát dĩ kệ vấn viết:',
        ],
        vi: [
          'Vô Tận Ý! Quán-Thế-Âm Bồ-tát có sức thần tự tại như thế, dạo đi nơi cõi Ta-bà. Lúc đó, ngài Vô-Tận-Ý Bồ-tát nói kệ hỏi Phật rằng:',
        ],
      },
      {
        l: ['Thế Tôn diệu tướng cụ', 'ngã kim trùng vấn bỉ', 'Phật tử hà nhân duyên', 'danh vi Quán Thế Âm.'],
        vi: ['Thế Tôn đủ tướng tốt!', 'Con nay lại hỏi kia', 'Phật Tử nhân duyên gì', 'Tên là Quán Thế Âm?'],
      },
      {
        l: ['Cụ túc diệu tướng tôn', 'kệ đáp Vô Tận Ý', 'nhữ thính Quán Âm hạnh', 'thiện ứng chư phương sở'],
        vi: ['Đấng đầy đủ tướng tốt', 'Kệ đáp Vô Tận Ý:', 'Ông nghe hạnh Quán-Âm', 'Khéo ứng các nơi chỗ'],
      },
      {
        l: ['Hoằng thệ thâm như hải', 'lịch kiếp bất tư nghì', 'thị đa thiên ức Phật', 'phát đại thanh tịnh nguyện'],
        vi: [
          'Thệ rộng sâu như biển',
          'Nhiều kiếp chẳng nghĩ bàn',
          'Hầu nhiều nghìn đức Phật',
          'Phát nguyện thanh tịnh lớn.',
        ],
      },
      {
        l: ['Ngã vị nhữ lược thuyết', 'văn danh cập kiến thân', 'tâm niệm bất không quá', 'năng diệt chư hữu khổ'],
        vi: ['Ta vì ông lược nói', 'Nghe tên cùng thấy thân', 'Tâm niệm chẳng luống qua', 'Hay diệt khổ các cõi'],
      },
      {
        l: ['Giả sử hưng hại ý', 'thôi lạc đại hỏa khanh', 'niệm bỉ Quán Âm lực', 'hỏa khanh biến thành trì'],
        vi: ['Giả sử sinh lòng hại', 'Xô rớt hầm lửa lớn', 'Do sức niệm Quán-Âm', 'Hầm lửa biến thành ao'],
      },
      {
        l: ['Hoặc phiêu lưu cự hải', 'long ngư chư quỷ nạn', 'niệm bỉ Quán Âm lực', 'ba lãng bất năng một'],
        vi: ['Hoặc trôi dạt biển lớn', 'Các nạn quỷ, cá, rồng', 'Do sức niệm Quán-Âm', 'Sóng mòi chẳng chìm được'],
      },
      {
        l: ['Hoặc tại Tu Di Phong', 'vi nhân sở thôi đọa', 'niệm bỉ Quán Âm lực', 'như nhật hư không trụ'],
        vi: ['Hoặc ở chót Tu Di', 'Bị người xô rớt xuống', 'Do sức niệm Quán-Âm', 'Như mặt nhật treo không'],
      },
      {
        l: ['Hoặc bị ác nhân trục', 'đọa lạc Kim Cang Sơn', 'niệm bỉ Quán Âm lực', 'bất năng tổn nhất mao'],
        vi: ['Hoặc bị người dữ rượt', 'Rớt xuống núi Kim-cang', 'Do sức niệm Quán-Âm', 'Chẳng tổn đến mảy lông'],
      },
      {
        l: ['Hoặc trị oán tặc nhiễu', 'các chấp đao gia hại', 'niệm bỉ Quán Âm lực', 'hàm tức khởi từ tâm'],
        vi: ['Hoặc gặp oán tặc vây', 'Đều cầm dao làm hại', 'Do sức niệm Quán-Âm', 'Đều liền sinh lòng lành'],
      },
      {
        l: ['Hoặc tao vương nan khổ', 'lâm hình dục thọ chung', 'niệm bỉ Quán Âm lực', 'đao tầm đoạn đoạn hoại'],
        vi: ['Hoặc bị khổ nạn vua', 'Khi hành hình sắp chết', 'Do sức niệm Quán-Âm', 'Dao liền gãy từng đoạn'],
      },
      {
        l: ['Hoặc tù cấm già tỏa', 'thủ túc bị sữu giới', 'niệm bỉ Quán Âm lực', 'thích nhiên đắc giải thoát'],
        vi: ['Hoặc tù cấm xiềng xích', 'Tay chân bị gông cùm', 'Do sức niệm Quán-Âm', 'Tháo rã được giải thoát'],
      },
      {
        l: ['Chú trớ chư độc dược', 'sở dục hại thân giả', 'niệm bỉ Quán Âm lực', 'hoàn chư ư bổn nhân'],
        vi: ['Nguyền rủa các thuốc độc', 'muốn hại đến thân đó', 'Do sức niệm Quán-Âm', 'Trở hại nơi bổn nhân'],
      },
      {
        l: ['Hoặc ngộ ác La Sát', 'độc long chư quỷ đẳng', 'niệm bỉ Quán Âm lực', 'thời tất bất cảm hại'],
        vi: ['Hoặc gặp La Sát dữ', 'Rồng độc các loài quỷ', 'Do sức niệm Quán-Âm', 'Liền đều không dám hại'],
      },
      {
        l: ['Nhược ác thú vi nhiễu', 'lợi nha trảo khả bố', 'niệm bỉ Quán Âm lực', 'tật tẩu vô biên phương'],
        vi: ['Hoặc thú dữ vây quanh', 'Nanh vuốt nhọn đáng sợ', 'Do sức niệm Quán-Âm', 'Vội vàng bỏ chạy thẳng'],
      },
      {
        l: ['Ưng xà cập phúc yết', 'khí độc yên hỏa nhiên', 'niệm bỉ Quán Âm lực', 'tầm thanh tự hồi khứ'],
        vi: ['Rắn độc cùng bò cạp', 'Hơi độc khói lửa đốt', 'Do sức niệm Quán-Âm', 'Theo tiếng tự bỏ đi'],
      },
      {
        l: ['Vân lôi cổ xiết điện', 'giáng bạc chú đại vũ', 'niệm bỉ Quán Âm lực', 'ứng thời đắc tiêu tán'],
        vi: ['Mây sấm nổ sét đánh', 'Tuôn giá, xối mưa lớn', 'Do sức niệm Quán-Âm', 'Liền được tiêu tan cả'],
      },
      {
        l: ['Chúng sanh bị khốn ách', 'vô lượng khổ bức thân', 'Quán Âm diệu trí lực', 'năng cứu thế gian khổ'],
        vi: ['Chúng sinh bị khổ ách', 'Vô lượng khổ bức thân', 'Quán-Âm sức trí diệu', 'Hay cứu khổ thế gian'],
      },
      {
        l: ['Cụ túc thần thông lực', 'quảng tu trí phương tiện', 'thập phương chư quốc độ', 'vô sát bất hiện thân'],
        vi: [
          'Đầy đủ sức thần thông',
          'Rộng tu trí phương tiện',
          'Các cõi nước mười phương',
          'Không cõi nào chẳng hiện',
        ],
      },
      {
        l: ['Chủng chủng chư ác thú', 'địa ngục quỷ súc sanh', 'sanh lão bệnh tử khổ', 'dĩ tiệm tất lệnh diệt'],
        vi: [
          'Các loài trong đường dữ:',
          'Địa ngục, quỷ, súc sanh',
          'Sinh, già, bệnh, chết khổ',
          'Lần đều khiến dứt hết',
        ],
      },
      {
        l: [
          'Chân quán thanh tịnh quán',
          'quảng đại trí tuệ quán',
          'bi quán cập từ quán',
          'thường nguyện thường chiêm ngưỡng',
        ],
        vi: [
          'Chân quán thanh tịnh quán',
          'Trí tuệ quán rộng lớn',
          'Bi quán và từ quán',
          'Thường nguyện thường chiêm ngưỡng',
        ],
      },
      {
        l: ['Vô cấu thanh tịnh quang', 'huệ nhật phá chư ám', 'năng phục tai phong hỏa', 'phổ minh chiếu thế gian'],
        vi: ['Sáng thanh tịnh không nhơ', 'Tuệ nhật phá các tối', 'Hay phục tai khói lửa', 'Khắp soi sáng thế gian'],
      },
      {
        l: ['Bi thể giới lôi chấn', 'từ ý diệu đại vân', 'chú cam lộ pháp vũ', 'diệt trừ phiền não diệm'],
        vi: ['Lòng bi ran như sấm', 'Ý Tứ diệu dường mây', 'Xối mưa pháp cam lộ', 'Dứt trừ lửa phiền não'],
      },
      {
        l: ['Tranh tụng kinh quan xứ', 'bố úy quân trận trung', 'niệm bỉ Quán Âm lực', 'chúng oán tất thối tán'],
        vi: ['Cãi kiện qua chỗ quan', 'Trong quân trận sợ sệt', 'Do sức niệm Quán-Âm', 'Cừu oán đều lui tan'],
      },
      {
        l: ['Diệu Âm Quán Thế Âm', 'Phạm Âm Hải Triều Âm', 'thắng bỉ thế gian âm', 'thị cố tu thường niệm'],
        vi: ['Diệu Âm, Quán Thế Âm', 'Phạm Âm, Hải Triều Âm', 'Tiếng hơn thế gian kia', 'Cho nên thường phải niệm'],
      },
      {
        l: ['Niệm niệm vật sanh nghi', 'Quán Thế Âm tịnh thánh', 'ư khổ não tử ách', 'năng vị tác y hỗ'],
        vi: ['Niệm niệm chớ sanh nghi', 'Quán-Âm bậc tịnh thánh', 'Nơi khổ não nạn chết', 'Hay vì làm nương cậy'],
      },
      {
        l: ['Cụ nhất thiết công đức', 'từ nhãn thị chúng sanh', 'phúc tụ hải vô lượng', 'thị cố ứng đảnh lễ.'],
        vi: ['Đủ tất cả công đức', 'Mắt lành trông chúng sanh', 'Biển phúc lớn không lường', 'Cho nên phải đảnh lễ'],
      },
      {
        l: [
          'Nhĩ thời Trì Địa Bồ tát, tức tùng tòa khởi, tiền bạch Phật ngôn: “Thế Tôn, nhược hữu chúng sanh văn thị Quán thế âm Bồ tát phẩm, tự tại chi nghiệp, phổ môn thị hiện, thần thông lực giả; đương tri thị nhân công đức bất thiểu”.',
        ],
        vi: [
          'Bấy giờ, ngài Trì-Địa Bồ-tát liền từ chỗ ngồi đứng dậy đến trước Phật bạch rằng: “Thế Tôn! Nếu có chúng sanh nào nghe phẩm Quán-Thế-Âm Bồ-tát đạo nghiệp tự tại, Phổ môn thị hiện sức thần thông này, thời phải biết công đức người đó chẳng ít”.',
        ],
      },
      {
        l: [
          'Phật thuyết thị Phổ môn phẩm thời, chúng trung bát vạn tứ thiên chúng sanh, giai phát vô đẳng đẳng A nậu đa la tam miệu tam bồ đề tâm.',
        ],
        vi: [
          'Lúc Phật nói phẩm Phổ Môn này, trong chúng có 8 muôn 4 nghìn chúng sanh đều phát tâm vô thượng chánh đẳng chánh giác.',
        ],
      },
      {
        l: ['Nam mô hiệu viên thông, danh tự tại, Quán Âm Như Lai quảng phát hoằng thệ nguyện.'],
      },
      {
        l: ['Nam mô nhất niệm tâm vô quái ngại, Quán Âm Như Lai thường cư Nam Hải nguyện.'],
      },
      {
        l: ['Nam mô trụ Ta Bà, U Minh giới, Quán Âm Như Lai tầm thinh cứu khổ nguyện.'],
      },
      {
        l: ['Nam mô hàng tà ma trừ yêu quái, Quán Âm Như Lai năng trừ nguy hiểm nguyện.'],
      },
      {
        l: ['Nam mô thanh tịnh bình, thùy dương liễu Quán Âm Như Lai cam lồ sái tâm nguyện.'],
      },
      {
        l: ['Nam mô đại từ bi, năng hỷ xả, Quán Âm Như Lai thường hành bình đẳng nguyện.'],
      },
      {
        l: ['Nam mô trú dạ tuần vô tổn hoại, Quán Âm Như Lai thệ diệt tam đồ nguyện.'],
      },
      {
        l: ['Nam mô vọng Nam nham, cầu lễ bái, Quán Âm Như Lai gìa tỏa giải thoát nguyện.'],
      },
      {
        l: ['Nam mô tạo Pháp thuyền, du khổ hải Quán Âm Như Lai độ tận chúng sanh nguyện.'],
      },
      {
        l: ['Nam mô tiền tràng phan, hậu bảo cái Quán Âm Như Lai tiếp dẫn Tây Phương nguyện.'],
      },
      {
        l: ['Nam mô Vô Lượng Thọ Phật cảnh giới Quán Âm Như Lai Di Đà thọ ký nguyện.'],
      },
      {
        l: ['Nam mô đoan nghiêm thân, vô tỷ toại, Quán Âm Như Lai quả tu thập nhị nguyện.'],
      },
    ],
  },
  'vu-lan': {
    title: 'Kinh Vu Lan',
    kind: 'kinh',
    paras: [
      {
        l: [
          'Văn như thị. Nhất thời Phật tại Xá Vệ quốc, Kỳ thọ Cấp Cô Độc viên. Đại Mục Kiền Liên, thỉ đắc lục thông, dục độ phụ mẫu, báo nhũ bộ chi ân; tức dĩ đạo nhãn quán thị thế gian,',
        ],
        vi: [
          'Ta từng nghe lời tạc như vầy:',
          'Một thuở nọ Thế-Tôn an-trụ,',
          'Xá-Vệ thành Kỳ-Thụ viên trung,',
          'Mục-Liên mới đặng lục-thông,',
          'Muốn cho cha mẹ khỏi vòng trầm-luân.',
          'Công dưỡng-dục thâm-ân dốc trả,',
          'Nghĩa sanh thành đạo cả mong đền,',
          'Làm con hiếu-hạnh vi tiên,',
          'Bèn dùng huệ-nhãn dưới trên kiếm tầm.',
        ],
      },
      {
        l: [
          'kiến kỳ vong mẫu sanh ngạ quỉ trung, bất kiến ẩm thực, bì cốt liên lập. Mục Liên bi ai, tức dĩ bát thịnh phạn, vãng hướng kỳ mẫu.',
        ],
        vi: [
          'Thấy vong-mẫu sanh làm ngạ-quỉ,',
          'Không uống ăn tiều-tụy hình-hài.',
          'Mục-Liên thấy vậy bi-ai,',
          'Biết mẹ đói khát ai-hoài tình thâm.',
          'Lo phẩm-vật đem dâng từ-mẫu,',
          'Đặng đỡ lòng cực khổ bấy lâu.',
        ],
      },
      {
        l: [
          'Mẫu đắc bát phạn, tiện dĩ tả thủ chưởng bát, hữu thủ bác thực, thực vị nhập khẩu, hóa thành hỏa thán, toại bất đắc thực.',
        ],
        vi: [
          'Thấy cơm, mẹ rất lo âu,',
          'Tay tả che đậy, hữu hầu bốc ăn.',
          'Lòng bỏn xẻn tiền-căn chưa dứt,',
          'Sợ chúng ma cướp giựt của bà.',
          'Cơm đưa chưa tới miệng đà,',
          'Hóa thành than lửa nuốt mà đặng đâu,',
        ],
      },
      {
        l: ['Mục Liên đại khiếu, bi hào thế khấp, trì hoàn bạch Phật, cụ trần như thử.'],
        vi: [
          'Thấy như vậy âu-sầu thê-thảm,',
          'Mục-Kiền-Liên bi cảm xót thương,',
          'Mau mau về đến giảng-đường,',
          'Bạch cùng Sư-phụ tìm phương giải-nàn.',
        ],
      },
      {
        l: ['Phật ngôn: Nhữ mẫu tội căn thâm kết, phi nhữ nhất nhân lực sở nại hà.'],
        vi: [
          'Phật mới bảo rõ-ràng căn-cội,',
          'Rằng mẹ ông gốc tội rất sâu.',
          'Dầu ông thần lực nhiệm-mầu,',
          'Một mình không thể ai cầu được đâu.',
        ],
      },
      {
        l: [
          'Nhữ tuy hiếu thuận, thanh động thiên địa, thiên địa thần kỳ, tà ma ngoại đạo, đạo sĩ tứ thiên vương thần, diệc bất năng nại hà!',
        ],
        vi: [
          'Lòng hiếu thảo của ông dầu lớn,',
          'Tiếng vang đồn thấu đến Cửu Thiên.',
          'Cùng là các bực Thần-kỳ,',
          'Tà, ma ngoại-đạo, bốn vì Thiên-Vương,',
          'Cộng ba cõi sáu phương tu-tập,',
          'Cũng không phương cứu-tế mẹ ngươi.',
        ],
      },
      {
        l: [
          'Đương tu thập phương chúng Tăng oai thần chi lực, nãi đắc giải thoát. Ngô kim đương thuyết cứu tế chi pháp, linh nhất thiết nạn giai ly ưu khổ.',
        ],
        vi: [
          'Muốn cho cứu đặng mạng người.',
          'Phải nhờ thần-lực của mười phương Tăng.',
          'Pháp cứu-tế Ta toan giải nói,',
          'Cho mọi người thoát khỏi ách-nàn,',
        ],
      },
      {
        l: [
          'Phật cáo Mục Liên: Thập phương chúng Tăng, thất nguyệt thập ngũ nhật, Tăng tự tứ thời, đương vị thất thế phụ mẫu, cập hiện tại phụ mẫu, ách nạn trung giả, cụ phạn bách vị, ngũ quả, cấp quán bồn khí, hương du, đính chúc, sàng phu ngọa cụ, tận thế cam mỹ dĩ trước bồn trung, cúng dường thập phương đại đức chúng tăng.',
        ],
        vi: [
          'Bèn kêu Mục-thị đến gần,',
          'Truyền cho diệu-pháp ân cần thiết thi,',
          'Rằm tháng bảy là ngày Tự-tứ,',
          'Mười phương Tăng đều dự lễ này,',
          'Phải toan sắm-sửa chớ chầy,',
          'Đồ ăn trăm món trái cây năm màu.',
          'Lại phải sắm giường nằm nệm lót,',
          'Cùng thau, bồn, đèn đuốc, nhang dầu,',
          'Món ăn tinh-sạch báu mầu,',
          'Đựng trong bình-bát vọng-cầu kính dâng,',
          'Chư Đại-đức mười phương thọ-thực,',
          'Trong bảy đời sẽ đặng siêu thăng.',
          'Lại thêm cha mẹ hiện-tiền,',
          'Đặng nhờ phước lực tiêu-khiên ách-nàn.',
        ],
      },
      {
        l: ['Đương thử chi nhật, nhất thiết Thánh chúng, hoặc tại sơn gian thiền định,'],
        vi: [
          'Vì ngày ấy Thánh-tăng đều đủ,',
          'Dầu ở đâu cũng tụ hội về.',
          'Như người Thiền định Sơn-khê,',
          'Tránh điều phiền-não chăm về thiền-na,',
        ],
      },
      {
        l: ['hoặc đắc tứ đạo quả, hoặc tại thọ hạ kinh hành,'],
        vi: [
          'Hoặc người đặng bốn tòa đạo quả,',
          'Công tu hành-nguyện thỏa vô-Sanh,',
          'Hoặc người thọ hạ kinh-hành,',
          'Chẳng ham quyền-quí ẩn danh lâm-tòng,',
        ],
      },
      {
        l: [
          'hoặc lục thông tự tại giáo hóa Thanh Văn, Duyên Giác, hoặc thập địa Bồ Tát đại nhân, quyền hiện Tỷ kheo, tại đại chúng trung,',
        ],
        vi: [
          'Hoặc người đặng lục-thông tấn-phát,',
          'Và những hàng Duyên-giác, Thanh-văn,',
          'Hoặc chư Bồ-tát mười phương,',
          'Hiện hình làm sãi ở gần chúng-sanh,',
        ],
      },
      {
        l: ['giai đồng nhất tâm, thọ bát hòa la phạn, cụ thanh tịnh giới, Thánh chúng chi đạo, kỳ đức uông dương,'],
        vi: [
          'Đều trì giới rất thanh, rất tịnh,',
          'Đạo-đức dày chánh-định chơn-tâm,',
          'Tất cả các bực Thánh, Phàm,',
          'Đồng lòng thọ lãnh bát-cơm lục-hòa,',
        ],
      },
      {
        l: [
          'kỳ hữu cúng dường thử đẳng tự tứ Tăng giả, hiện thế phụ mẫu, lục thân quyến thuộc, đắc xuất tam đồ chi khổ ứng thời giải thoát, y thực tự nhiên,',
        ],
        vi: [
          'Người nào có sắm ra vật thực,',
          'Đặng cúng-dường Tự-tứ Tăng thời,',
          'Hiện-tiền phụ mẫu của người,',
          'Bà con quyến-thuộc thảy đều nhờ ơn,',
          'Tam-đồ khổ chắc rằng ra khỏi,',
          'Cảnh thanh nhàn hưởng-thọ tự-nhiên.',
        ],
      },
      {
        l: [
          'nhược phụ mẫu hiện tại giả, phước lạc bách niên, nhược thất thế phụ mẫu sanh Thiên, tự tại hóa sanh, nhập thiên hoa quang.',
        ],
        vi: [
          'Như còn cha mẹ hiện-tiền.',
          'Nhờ đó cũng đặng bá niên thọ-trường,',
          'Như cha me bảy đời quá-vãng,',
          'Sẽ hóa sanh về cõi thiên cung,',
          'Người thời tuấn-tú hình-dung,',
          'Hào-quang chiếu sáng khắp cùng châu-thân,',
        ],
      },
      {
        l: ['Thời Phật sắc thập phương chúng tăng, giai tiên vị thí chủ gia chú nguyện,'],
        vi: [
          'Phật dạy bảo mười phương Tăng-chúng,',
          'Phải tuân theo thể-thức sau nầy:',
          'Trước khi thọ thực đàn chay,',
          'Phải cầu chú nguyện cho người tín-gia.',
        ],
      },
      {
        l: ['nguyện thất thế phụ mẫu, hành thiền định ý, nhiên hậu thọ thực.'],
        vi: [
          'Cầu thất-thế mẹ cha thí-chủ,',
          'Định tâm-thần quán đủ đừng quên,',
          'Cho xong định ý hành-thiền,',
          'Mới dùng phẩm-vật đàn tiền hiến dưng.',
        ],
      },
      {
        l: [
          'Sơ thọ thực thời, tiên an tại Phật tiền, tháp tự trung Phật tiền, chúng tăng chú nguyện cánh, tiện tự thọ thực.',
        ],
        vi: [
          'Khi thọ-dụng, nên an vật-thực,',
          'Trước Phật-đài hoặc tự tháp trung:',
          'Chư Tăng chú nguyện viên dung,',
          'Sau rồi tự tiện thọ dùng bữa trưa,',
        ],
      },
      {
        l: [
          'Thời Mục Liên tỳ kheo cập đại Bồ Tát chúng giai đại hoan hỉ, Mục Liên bi đề khấp thanh thích nhiên trừ diệt. thời Mục Liên mẫu tức ư thị nhật, đắc thoát nhất kiếp ngạ quỉ chi khổ.',
        ],
        vi: [
          'Pháp cứu tế Phật vừa nói dứt,',
          'Mục-Liên cùng Bồ-tát chư Tăng,',
          'Đồng nhau tỏ dạ vui mừng,',
          'Mục-Liên cũng hết khóc thương rầu buồn,',
          'Mục-Liên Mẫu cũng trong ngày ấy,',
          'Kiếp khổ về ngạ-quỉ được tan,',
        ],
      },
      {
        l: [
          'Mục Liên phục bạch Phật ngôn: Đệ tử sở sanh mẫu, đắc mông Tam Bảo công đức chi lực, chúng tăng oai thần lực cố;',
        ],
        vi: [
          'Mục-Liên bạch với Phật rằng:',
          'Mẹ con nhờ sức Thánh-Tăng khỏi nàn,',
          'Lại cũng nhờ oai thần Tam-Bảo,',
          'Bằng chẳng thì nạn khổ khó ra',
        ],
      },
      {
        l: [
          'nhược vị lai thế, nhất thiết Phật đệ tử, diệc ưng phụng Vu Lan bồn, cứu độ hiện tại phụ mẫu, nãi chí thất thế phụ mẫu, khả vị nhĩ phủ?',
        ],
        vi: [
          'Như sau đệ-tử xuất-gia,',
          'Vu-Lan-Bồn pháp dùng mà độ sanh.',
          'Độ cha mẹ còn đương tại thế,',
          'Hoặc bảy đời có thể đặng không?',
        ],
      },
      {
        l: [
          'Phật ngôn: Đại thiện khoái vấn! Ngã chánh dục thuyết, nhữ kim phục vấn. thiện nam tử! Nhược tỳ kheo tỳ kheo ni, quốc vương thái tử, đại thần tể tướng, tam công bách quan, vạn dân thứ nhân, hành từ hiếu giả, giai ưng tiên vị sở sanh hiện tại phụ mẫu, quá khứ thất thế phụ mẫu,',
        ],
        vi: [
          'Phật rằng: lời hỏi rất thông,',
          'Ta vừa muốn nói con vùng hỏi theo,',
          'Thiện-nam tử, tỳ-kheo nam-nữ,',
          'Cùng Quốc-vương, Thái-tử, Đại-thần,',
          'Tam-công, tể-tướng, bá-quan,',
          'Cùng hàng lê-thứ vạn dân cõi trần,',
          'Như chí muốn đền ơn cha mẹ,',
          'Hiện-tại cùng thất-thế tình thâm,',
        ],
      },
      {
        l: ['ư thất nguyệt thập ngũ nhật, Phật hoan hỉ nhật, Tăng tự tứ nhật, dĩ bách vị phạn thực,'],
        vi: [
          'Đến rằm tháng bảy mỗi năm,',
          'Sau khi kiết-hạ chư Tăng tựu về,',
          'Chính ngày ấy Phật, đã hoan-hỷ,',
          'Phải sắm sanh bá vị cơm canh,',
        ],
      },
      {
        l: [
          'an Vu Lan bồn trung, thí thập phương tự tứ Tăng nguyện sử hiện tại phụ mẫu, thọ mạng bách niên vô bệnh, vô nhất thiết khổ não chi hoạn,',
        ],
        vi: [
          'Đựng trong bình-bát tinh anh,',
          'Chờ giờ Tự-tứ chúng Tăng cúng-dường,',
          'Đặng cầu-nguyện song-đường trường-thọ,',
          'Chẳng ốm đau cũng chẳng khổ chi,',
        ],
      },
      {
        l: ['nãi chí thất thế phụ mẫu ly ác quỉ khổ, sanh nhân thiên trung, phước lạc vô cực.'],
        vi: [
          'Cùng cầu thất-thế đồng thì,',
          'Lìa nơi ngạ-quỉ sanh về nhơn, thiên,',
          'Đặng hưởng phước nhân duyên vui đẹp.',
          'Lại xa lìa nạn khổ cực thân,',
        ],
      },
      {
        l: [
          'Thị Phật đệ tử tu hiếu thuận giả, ưng niệm niệm trung, thường ức phụ mẫu, nãi chí thất thế phụ mẫu, niên niên thất nguyệt thập ngũ nhật, thường dĩ hiếu từ, ức sở sanh phụ mẫu,',
        ],
        vi: [
          'Môn-sanh Phật-tử ân cần,',
          'Hạnh tu hiếu-thuận phải cần phải chuyên.',
          'Thường cầu nguyện thung-huyên an-hảo,',
          'Cùng bảy đời phụ-mẫu siêu-sanh',
          'Ngày rằm tháng bảy mỗi năm,',
          'Vì lòng hiếu-thảo ơn-thâm phải đền.',
        ],
      },
      {
        l: [
          'vị tác Vu Lan bồn, thí Phật cập tăng, dĩ báo phụ mẫu trưởng dưỡng từ ái chi ân. Nhược nhất thiết Phật đệ tử, ưng thường phụng trì thị pháp.',
        ],
        vi: [
          'Lễ cứu-tế chí-thành sắp đặt,',
          'Ngõ cúng-dường chư Phật chư Tăng.',
          'Ấy là báo đáp, thù ân,',
          'Sanh-thành dưỡng-dục song-thân buổi đầu,',
          'Đệ-tử Phật, lo âu gìn-giữ,',
          'Mới phải là Thích-tử Thiền-môn,',
        ],
      },
      {
        l: ['Thời Mục Liên Tỳ Kheo, tứ bối đệ tử, hoan hỉ phụng hành.'],
        vi: [
          'Vừa nghe dứt pháp Lan-Bồn,',
          'Môn sanh tứ-chúng thảy đồng hỷ-hoan,',
          'Mục-Liên với bốn ban Phật-tử,',
          'Nguyện một lòng tín-sự phụng-hành,',
        ],
      },
    ],
  },
  'tan-phat': {
    title: 'Tán Phật A Di Đà',
    kind: 'ke',
    paras: [
      {
        l: ['A di đà Phật thân kim sắc'],
        vi: ['A-di-đà Phật thân sắc vàng,'],
      },
      {
        l: ['Tướng hảo quang minh vô đẳng luân'],
        vi: ['Tướng tốt quang minh tự trang nghiêm,'],
      },
      {
        l: ['Bạch hào uyển chuyển ngũ Tu di'],
        vi: ['Năm Tu-di uyển chuyển bạch hào,'],
      },
      {
        l: ['Cám mục trừng thanh tứ đại hải'],
        vi: ['Bốn biển lớn trong ngần mắt biếc.'],
      },
      {
        l: ['Quang trung hóa Phật vô số ức'],
        vi: ['Trong hào quang hóa vô số Phật,'],
      },
      {
        l: ['Hóa Bồ tát chúng diệc vô biên'],
        vi: ['Vô số Bồ-tát hiện ở trong,'],
      },
      {
        l: ['Tứ thập bát nguyện độ chúng sanh'],
        vi: ['Bốn mươi tám nguyện độ chúng sanh,'],
      },
      {
        l: ['Cửu phẩm hàm linh đăng bỉ ngạn'],
        vi: ['Chín phẩm sen vàng lên giải thoát.'],
      },
      {
        l: ['Nam mô Tây phương Cực lạc thế giới, đại từ đại bi, A di đà Phật'],
      },
      {
        l: ['Nam mô A di đà Phật'],
      },
      {
        l: ['Nam mô Đại bi Quán Thế Âm Bồ tát'],
      },
      {
        l: ['Nam mô Đại Thế Chí Bồ tát'],
      },
      {
        l: ['Nam mô Địa Tạng Vương Bồ tát'],
      },
      {
        l: ['Nam mô Thanh tịnh Đại Hải chúng Bồ tát'],
      },
    ],
  },
  'tam-quy-y': {
    title: 'Tam Quy Y',
    kind: 'ke',
    paras: [
      {
        l: ['Tự quy y Phật', 'đương nguyện chúng sanh', 'thể giải đại đạo', 'phát vô thượng tâm.'],
      },
      {
        l: ['Tự quy y Pháp,', 'đương nguyện chúng sanh,', 'thâm nhập kinh tạng,', 'trí huệ như hải.'],
      },
      {
        l: ['Tự quy y Tăng', 'đương nguyện chúng sanh', 'thống lý đại chúng,', 'nhất thiết vô ngại.'],
      },
      {
        l: ['Hoà nam Thánh chúng'],
      },
    ],
  },
  'hoi-huong': {
    title: 'Hồi Hướng',
    kind: 'ke',
    paras: [
      {
        l: ['Phúng kinh công đức thù thắng hạnh', 'Vô biên thắng phước giai hồi hướng'],
      },
      {
        l: ['Phổ nguyện pháp giới chư chúng sanh', 'Tốc vãng Vô Lượng Quang Phật sát'],
      },
      {
        l: ['Nguyện tiêu tam chướng trừ phiền não', 'Nguyện đắc trí huệ chân minh liễu'],
      },
      {
        l: ['Phổ nguyện tội chướng tất tiêu trừ', 'Thế thế thường hành Bồ tát đạo'],
      },
      {
        l: ['Nguyện sanh Tây phương Tịnh độ trung', 'Cửu phẩm Liên hoa vi phụ mẫu'],
      },
      {
        l: ['Hoa khai kiến Phật ngộ vô sanh', 'Bất thối Bồ tát vi bạn lữ'],
      },
      {
        l: ['Nguyện dĩ thử công đức', 'Phổ cập ư nhất thiết'],
      },
      {
        l: ['Ngã đẳng dữ chúng sanh', 'Giai cộng thành Phật đạo'],
      },
    ],
  },
};
