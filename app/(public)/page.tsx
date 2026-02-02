import Link from 'next/link';
import NewsSection, { News } from '../components/NewsSection';
import ScheduleSection from '../components/ScheduleSection';

// Instagramの型定義
type InstagramMedia = {
  id: string;
  media_url: string;
  permalink: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  thumbnail_url?: string;
};

// Instagram Graph APIからメディアを取得する関数
async function getInstagramMedia() {
  // 環境変数から読み込む
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessId = process.env.INSTAGRAM_BUSINESS_ID;

  if (!accessToken || !businessId) {
    console.error('Instagram API Key or ID is missing');
    return [];
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${businessId}/media?fields=id,media_url,permalink,media_type,thumbnail_url&limit=9&access_token=${accessToken}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      // エラーの詳細をVercelのログに出すためにテキストを取得
      const errorDetail = await res.text();
      console.error(`Failed to fetch Instagram: ${res.status} ${res.statusText}`, errorDetail);
      throw new Error('Failed to fetch Instagram');
    }

    const data = await res.json();
    return data.data as InstagramMedia[];
  } catch (error) {
    console.error('Error fetching Instagram:', error);
    return [];
  }
}

// microCMSからニュースを取得する関数
async function getNews() {
  const apiKey = process.env.MICROCMS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://ananda.microcms.io/api/v1/news?limit=4', {
      headers: { 'X-MICROCMS-API-KEY': apiKey },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch news');
    const data = await res.json();
    return data.contents as News[];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

// microCMSからスケジュールを取得する関数
async function getSchedules() {
  const apiKey = process.env.MICROCMS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://ananda.microcms.io/api/v1/news?filters=schedule[equals]true&limit=3', {
      headers: { 'X-MICROCMS-API-KEY': apiKey },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch schedules');
    const data = await res.json();
    return data.contents as News[];
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
}

export default async function HomePage() {
  // 並行してデータを取得
  const [newsList, schedules, instaMedia] = await Promise.all([
    getNews(),
    getSchedules(),
    getInstagramMedia()
  ]);
  
  return (
    // ▼ ページ全体を包むコンテナ
    <div className="min-h-screen w-full bg-[#333] relative bg-[url('/img/bg_main2.jpg')] bg-fixed bg-center bg-cover">
      

      {/* ▼▼▼ スマホ幅コンテンツエリア（S中央寄せ） ▼▼▼ */}
      <div className="relative z-10 w-full max-w-[480px] mx-auto bg-white min-h-screen shadow-2xl flex flex-col font-sans text-[#333]">
        
        {/* メインビジュアルエリア */}
        <div className="w-full">
          <Link href="/program" className="block w-full">
             <img 
               src="/img/bnr_program.jpg" 
               alt="Program" 
               className="w-full h-auto object-cover max-w-5xl mx-auto shadow-lg" 
             />
          </Link>
        </div>

        {/* Concept Section */}
        <section className="bg-[#6D6353] text-white text-center py-12 px-6">
          <h2 className="text-xl font-bold mb-8 tracking-wider">
            ananda(आनन्दः) とは
          </h2>
          <p className="leading-loose text-sm font-medium opacity-90">
            サンスクリット語で<br />
            「完全な幸福」という意味です。<br />
            完全な幸福とは「自分を縛る制限<br />
            から自由になること」 です。<br />
            ヨガが、制限だらけの私たちを解放<br />
            する一助となりますように。
          </p>
        </section>

        {/* News Section */}
        {/* ★修正: id="news" を追加 */}
        <div id="news">
           <NewsSection newsList={newsList} />
        </div>

        {/* About Section */}
        <section className="relative h-[500px] flex items-center justify-center text-left px-6">
            <img 
              src="/img/bg_about.jpg" 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="About Background" 
            />
          <div className="relative z-10 text-white py-10">
              <h2 className="text-xl sm:text-2xl font-bold mb-8 leading-relaxed drop-shadow-md">
                伝統的な古典ハタヨガを通じて<br />幸福に生きられるように
              </h2>
              <p className="leading-loose text-sm sm:text-base max-w-2xl mx-auto font-medium drop-shadow-sm">
                私たちは常に、欠陥だらけの身体や心、<br />
                そして取り巻く状況からもありとあらゆる<br />
                制限を受けています。ヨガの瞑想や哲学、<br />
                呼吸法、アーサナ練習は、制限だらけの<br />
                自分を解放する術となります。<br />
                ヨガを通じて一人でも多くの人が自分らしく<br />
                幸せに生きられるようサポートしていきたい<br />
                と思います。
              </p>
          </div>
        </section>

        {/* Instagram Section (3行3列) */}
        <section className="py-16 bg-[#F7F5F0] text-center px-4">
          <h3 className="text-[#EEA51A] font-bold text-lg mb-1 font-sans tracking-wide">Instagram</h3>
          <h2 className="text-xl font-bold tracking-widest text-stone-700 mb-6">インスタグラム</h2>
          
          {/* グリッドレイアウト 3列 */}
          <div className="grid grid-cols-3 gap-1 mb-8 max-w-[400px] mx-auto">
            {instaMedia.length > 0 ? (
              instaMedia.map((media) => (
                <a 
                  key={media.id} 
                  href={media.permalink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="aspect-square relative overflow-hidden group bg-stone-200"
                >
                  <img 
                    src={media.media_type === 'VIDEO' ? media.thumbnail_url : media.media_url} 
                    alt="Instagram post" 
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                  />
                  {/* 動画アイコン表示（任意） */}
                  {media.media_type === 'VIDEO' && (
                    <div className="absolute top-1 right-1 text-white drop-shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  )}
                </a>
              ))
            ) : (
              <div className="col-span-3 py-10 text-stone-400 text-sm">読み込み中、または設定が必要です</div>
            )}
          </div>

          <a 
            href="https://www.instagram.com/anandayoga_maebashi/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-stone-500 text-sm font-bold hover:text-[#EEA51A] transition-colors border-b border-stone-300 pb-1"
          >
            @anandayoga_maebashi
          </a>
        </section>

        {/* Class Section */}
        {/* ★修正: id="lessons" を id="class" に変更 */}
        <section className="py-16 px-6 bg-[#F9F8F6]" id="class">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="text-[#EEA51A] font-bold text-lg mb-1 font-sans tracking-wide">Class</h3>
              <h2 className="text-xl font-bold tracking-widest text-stone-700">クラス</h2>
            </div>
            <div className="grid gap-6">
              {[
                { title: 'やさしいハタヨガ', desc: '心身のリラックスを目的としたクラスです。あお向け・座位を中心としたやさしいアーサナで深い呼吸を感じながらゆっくりと身体を開いていきます。呼吸法、瞑想法、アーサナを通して心と体の不調を取り去り、本来の自分に気づかせてくれるヨガです。' },
                { title: 'ハタヨガ', desc: 'ヨガの源流であり、ヨガを続けることで心と体を変えていきたいという方にお勧めのクラスです。身体が固くて不安な方、運動不足を気にされている方、筋力に衰えを感じる方、なんだか最近気分が落ち込み気味な方などなど、ヨガ未経験者の最初の一歩にお勧め。ヨガをした後の心や身体への感覚をお楽しみください。' },
                { title: '古式太陽礼拝', desc: 'インドで伝統的に行われている方法でスーリヤナマスカーラマントラを唱えながら太陽礼拝を練習します。前屈と後屈を繰り返し、背骨の曲げ伸ばしをすることで全身を深くストレッチします。酸素を全身に送り届け、心身をリラックスさせてくれます。' },
                { title: '瞑想プラーナヤマ', desc: '心が乱れているとき、呼吸は浅く、リラックスしているときは呼吸はゆっくり深くなります。呼吸と心は繋がっていて、様々な呼吸法を練習することで自分の心を扱う方法を知ることができます。アーサナ（ポーズ）はとらない瞑想クラスです。' },
                { title: '陰ヨガ', desc: '深い呼吸と共に脱力し、心と体にリラックスをもたらすセラピー要素の強いヨガです。体の深い組織、関節、靭帯、骨、筋膜といった結合組織に長くやさしく働きかけていきます。肉体だけでなく、感情的および精神的変化もあるヨガです。' },
                { title: 'パワーヨガ', desc: '呼吸と動きを合わせてアーサナがつながっていくレッスンです。力学に基づいた身体の使い方やアライメントを動きのなかで学ぶことができます。体幹を整え、腰痛・肩こりなどを予防する身体的作用と、自律神経の調整・不安の解消・集中力の向上などの精神的な作用が期待できます。続けることで真の心身の健康を得ることができます。' },
              ].map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="font-bold text-lg mb-3 text-stone-800">{item.title}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed text-justify">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Price Section */}
        {/* 既存: id="price" (OK) */}
        <section className="py-20 bg-white" id="price">
          <div className="max-w-sm mx-auto px-4">
            <div className="text-center mb-10">
              <h3 className="text-[#EEA51A] font-bold text-lg mb-1 font-sans tracking-wide">Price</h3>
              <h2 className="text-xl font-bold tracking-widest text-stone-700">料金</h2>
            </div>

            <div className="space-y-10">
               {/* ドロップイン */}
               <div>
                  <div className="text-center mb-4">
                     <span className="inline-block border border-stone-800 px-8 py-1.5 rounded-full text-sm font-bold">ドロップイン</span>
                  </div>
                  <div className="border border-stone-200 p-6 rounded-xl text-center bg-[#FDFBF7]">
                     <p className="font-bold text-sm mb-1">1回</p>
                     <p className="text-xl font-bold text-stone-800">¥3,000 <span className="text-xs text-stone-500 font-normal">(税込¥3,300)</span></p>
                  </div>
               </div>

               {/* 会員コース */}
               <div>
                  <div className="text-center mb-4">
                     <span className="inline-block border border-stone-800 px-8 py-1.5 rounded-full text-sm font-bold">会員コース</span>
                  </div>
                  <div className="space-y-3">
                     <div className="bg-stone-500 text-white p-4 text-center rounded-xl">
                       <div className="text-xs mb-1 font-medium">月4回コース</div>
                       <div className="text-lg font-bold tracking-wide">月額 ¥8,800 <span className="text-xs font-normal opacity-80">(税込¥9,680)</span></div>
                     </div>
                     <div className="bg-stone-500 text-white p-4 text-center rounded-xl">
                       <div className="text-xs mb-1 font-medium">月5回コース</div>
                       <div className="text-lg font-bold tracking-wide">月額 ¥9,900 <span className="text-xs font-normal opacity-80">(税込¥10,890)</span></div>
                     </div>
                     <div className="bg-[#EEA51A] text-white p-4 text-center rounded-xl shadow-md transform scale-105">
                       <div className="text-xs mb-1 font-bold">通い放題コース</div>
                       <div className="text-lg font-bold tracking-wide">月額 ¥13,800 <span className="text-xs font-normal opacity-80">(税込¥15,180)</span></div>
                     </div>
                  </div>
                  <div className="mt-6 text-xs text-stone-500 bg-stone-50 p-4 rounded-xl">
                    <p className="font-bold mb-1">ご入会時にお持ちいただくもの</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>クレジットカードもしくはキャッシュカード</li>
                      <li>月会費2ヶ月分 / 印鑑</li>
                    </ul>
                  </div>
               </div>

               {/* 回数券 */}
               <div>
                  <div className="text-center mb-4">
                     <span className="inline-block border border-stone-800 px-8 py-1.5 rounded-full text-sm font-bold">回数券</span>
                  </div>
                  <div className="bg-[#FDFBF7] border border-stone-100 p-5 rounded-xl space-y-4">
                    <div className="border-b border-stone-200 pb-2 flex justify-between items-baseline">
                      <span className="text-sm font-bold">3回券</span>
                      <span className="text-base font-bold">¥7,500 <span className="text-xs font-normal text-stone-500">(税込¥8,250)</span></span>
                    </div>
                    <div className="border-b border-stone-200 pb-2 flex justify-between items-baseline">
                      <span className="text-sm font-bold">5回券</span>
                      <span className="text-base font-bold">¥11,500 <span className="text-xs font-normal text-stone-500">(税込¥12,650)</span></span>
                    </div>
                    <div className="border-b border-stone-200 pb-2 flex justify-between items-baseline">
                      <span className="text-sm font-bold">10回券</span>
                      <span className="text-base font-bold">¥22,000 <span className="text-xs font-normal text-stone-500">(税込¥24,200)</span></span>
                    </div>
                    <div className="text-right text-xs text-stone-400">※有効期限あり</div>
                  </div>
               </div>
               
               <div className="text-xs text-stone-500 bg-stone-50 p-4 rounded-xl leading-relaxed">
                  <strong>※受講済みチケット15回分で、次回のチケット購入時に1,000円OFFさせていただきます。</strong><br/>
                  ※有効期限内に使い切れなかった場合は有効期限日から1カ月以内であれば、1回＋1,100円でご参加いただけます。<br/>
                  ※パーソナルレッスンや特別講座にはご利用いただけません。
               </div>

               {/* パーソナル */}
               <div>
                  <div className="text-center mb-6">
                    <span className="inline-block border border-stone-800 px-8 py-1 rounded-full text-sm font-bold">パーソナルレッスン (60分)</span>
                 </div>
                 <div className="flex justify-between items-center max-w-xs mx-auto border-b border-stone-200 pb-2 mb-6">
                   <div className="font-bold">1回</div>
                   <div>¥6,000 <span className="text-xs text-stone-500">(税込¥6,600)</span></div>
                 </div>

                 <div className="text-center mb-4">
                    <span className="inline-block border border-stone-800 px-8 py-1 rounded-full text-sm font-bold bg-white">パーソナル会員コース</span>
                 </div>
                 <div className="space-y-4 max-w-sm mx-auto mb-8">
                   <div className="bg-stone-500 text-white text-center py-2 rounded">
                      <div className="text-sm">月2回コース</div>
                      <div className="text-sm">月額 ¥11,400 <span className="text-xs opacity-80">(税込¥12,540)</span></div>
                   </div>
                   <div className="bg-[#EEA51A] text-white text-center py-2 rounded font-bold shadow-md">
                      <div className="text-sm">月4回コース</div>
                      <div className="text-sm">月額 ¥20,000 <span className="text-xs opacity-80">(税込¥22,000)</span></div>
                   </div>
                 </div>

                 <div className="max-w-sm mx-auto mb-8">
                     <div className="text-xs text-stone-500 bg-stone-50 p-4 rounded-xl mb-6">
                          <p className="font-bold mb-2">ご入会時にお持ちいただくもの</p>
                          <ul className="list-disc pl-4 space-y-1">
                              <li>クレジットカードもしくはキャッシュカード</li>
                              <li>月会費2ヶ月分</li>
                              <li>印鑑</li>
                          </ul>
                     </div>

                     <div className="text-xs leading-loose text-stone-600 text-justify">
                          <p className="mb-4">
                              身体の状態に合わせてその方だけの最適なシークエンスや練習法を作るプライベートレッスン。
                              身体の様子を観ながら緊張部位にはストレッチをかけ、弱化部位には筋力を養うアーサナを選び、そのかたに合わせたオーダーメイドのヨガレッスンを提供いたします。
                          </p>
                          <p className="mb-4">
                              「スタジオやジムでヨガをやっているけれど、正しいやり方を知りたい」という方はアライメントを学びながらヨガを進めていきますのでヨガをより深く理解することができます。
                              初心者の方もインストラクターと相談しながら、その時の体調などに合わせて自由にレッスンメニューを組むことができますので安心してヨガをお楽しみいただけます。
                          </p>
                          <p>
                              ＊ご希望の日時をメールにてお知らせください。レッスン可能か確認後、折り返しご連絡いたします。<br />
                              〈メールアドレス〉<a href="mailto:info@ananda-yogaschool.com" className="text-[#EEA51A] hover:underline">info@ananda-yogaschool.com</a>
                          </p>
                     </div>
                 </div>

                 <div className="bg-[#FDFBF7] p-4 rounded border border-stone-100 text-xs text-stone-600 max-w-sm mx-auto">
                    <div className="text-center font-bold mb-2">2名様以上で受講される場合 (お一人あたり)</div>
                    <dl className="grid grid-cols-2 gap-y-1 pl-4">
                       <dt>2名様</dt><dd>¥4,000 (税込¥4,400)</dd>
                       <dt>3名様</dt><dd>¥3,000 (税込¥3,300)</dd>
                       <dt>4名様</dt><dd>¥2,500 (税込¥2,750)</dd>
                       <dt>5名様以上</dt><dd>¥2,000 (税込¥2,200)</dd>
                    </dl>
                 </div>
               </div>

            </div>
          </div>
        </section>
        
        {/* Trial Lesson Section */}
        {/* 既存: id="trial" (OK) */}
        <section className="py-20 text-center" id="trial">
          <div className="section-inner max-w-4xl mx-auto px-4">
            <h3 className="text-[#EEA51A] font-bold text-lg mb-1 font-sans tracking-wide">Trial lesson</h3>
            <h2 className="text-xl font-bold tracking-widest text-stone-700 mb-10">体験レッスンの流れ</h2>
            
            <div className="bg-white border-2 border-[#EEA51A] p-8 rounded-none max-w-md mx-auto mb-12 shadow-[4px_4px_0px_0px_rgba(238,165,26,0.2)]">
              <div className="font-bold text-sm mb-2">初めての方限定</div>
              <div className="text-2xl font-bold text-[#EEA51A] mb-1">体験レッスン ¥2,200</div>
              <p className="text-xs text-stone-500 mb-4">グループレッスンを体験いただけます。</p>
              <div className="border border-stone-300 p-3 text-sm font-bold">
                体験当日の会員コースご入会で<br />入会金 税込¥3,000 ⇒ ¥0
              </div>
            </div>

            <div className="space-y-8 max-w-lg mx-auto text-left relative">
              <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-stone-200"></div>
              {[
                { step: '01', text: 'レッスンスケジュールを見て、受講するレッスンを選びます。初回はオールレベルのクラスがおすすめです。' },
                { step: '02', text: 'WEBの予約フォームからレッスンを予約します。' },
                { step: '03', text: '当日は、ヨガのできる動きやすい服装にあらかじめ着替えて、レッスン開始時刻の10分前にお越しください。' },
                { step: '04', text: 'スタジオに着いたら最初に同意書のご記入、受講料のお支払いをして、レッスンをお楽しみください。' },
              ].map((item) => (
                <div key={item.step} className="flex gap-6 relative z-10 bg-white items-start">
                  <div className="text-stone-200 font-bold text-4xl font-serif leading-none flex-shrink-0 bg-white pb-2 pr-2">
                      <span className="text-sm block text-stone-300 -mb-1">STEP</span>{item.step}
                  </div>
                  <p className="text-sm leading-relaxed pt-2 font-medium text-stone-600">{item.text}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-xs text-stone-500 border border-stone-200 p-2 inline-block">
                お持ち物 | 水・汗拭き用フェイスタオル<br/>
                (ヨガマットは無料レンタルがございます)
            </div>
          </div>
        </section>

        {/* Access Section */}
        {/* 既存: id="access" (OK) */}
        <section id="access" className="py-20 bg-[#F7F5F0]">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 className="text-[#EEA51A] font-bold text-lg mb-1 font-sans tracking-wide">Access</h3>
            <h2 className="text-xl font-bold tracking-widest text-stone-700 mb-10">アクセス</h2>
            
            {/* MAP */}
            <div className="bg-white px-8 py-2 rounded-full border border-stone-800 inline-block mb-6 text-sm font-bold tracking-widest">MAP</div>
            <div className="bg-white p-4 rounded-xl shadow-sm inline-block w-full max-w-2xl mb-12">
              <div className="aspect-video w-full bg-stone-200 mb-4 rounded overflow-hidden relative">
                <iframe 
                  src="https://maps.google.com/maps?q=36.377227,139.056983&output=embed&z=15" 
                  width="100%" height="100%" style={{border:0}} loading="lazy"
                  title="Google Map"
                ></iframe>
              </div>
              <div className="text-left flex flex-col items-start gap-4">
                  <img src="/logo.png" className="w-32 object-contain" alt="Logo"/>
                  <p className="text-sm leading-relaxed font-bold text-stone-600">
                    〒371-0831<br />
                    群馬県前橋市小相木町327 タカゼンビル2階<br />
                    駐車場　店舗裏に5台あり
                  </p>
              </div>
            </div>

            {/* 駐車場 */}
            <div className="bg-white px-8 py-2 rounded-full border border-stone-800 inline-block mb-6 text-sm font-bold tracking-widest">駐車場</div>
            <div className="bg-white p-6 max-w-xs mx-auto shadow-sm mb-12">
               <img src="/img/parking.png" className="w-full h-auto mb-2" alt="Parking"/>
               <p className="text-xs font-bold text-stone-600"><span className="text-[#EEA51A]">■</span>の駐車場（10番～14番）をご利用いただけます。</p>
            </div>

            {/* 経路案内 */}
            <div className="bg-white px-8 py-2 rounded-full border border-stone-800 inline-block mb-10 text-sm font-bold tracking-widest">経路案内</div>
            
            {/* 建物外観 */}
            <div className="w-full max-w-md mx-auto mb-12">
               <img src="/img/access_guide_top.jpg" alt="外観" className="w-full h-auto rounded-lg shadow-sm" />
            </div>

            {/* ステップ案内 */}
            <div className="max-w-xs mx-auto space-y-12">
               {[
                 { num: '01', text: 'こちらの窓の部屋が\nスタジオです', img: '/img/access_step1.jpg' },
                 { num: '02', text: 'こちらの入口から中に入って、\n階段で2階に上がります', img: '/img/access_step2.jpg' },
                 { num: '03', text: '2階のこちらのドアが\nスタジオ入口です', img: '/img/access_step3.jpg' },
                 { num: '04', text: 'マットを敷いて\nヨガを始めましょう', img: '/img/access_step4.jpg' },
               ].map((step, i) => (
                 <div key={i} className="relative pt-8">
                   {/* 吹き出し部分 */}
                   <div className="absolute top-0 left-0 right-0 z-10">
                      <div className="bg-white rounded-xl py-3 px-4 shadow-md flex items-center gap-3 w-[90%] mx-auto relative">
                         <span className="text-xl font-mono text-stone-800 font-medium">{step.num}</span>
                         <p className="text-xs font-bold text-stone-700 text-left leading-relaxed whitespace-pre-wrap flex-1">
                            {step.text}
                         </p>
                         {/* 吹き出しの三角 */}
                         <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
                      </div>
                   </div>
                   
                   {/* 画像部分 */}
                   <div className="rounded-2xl overflow-hidden shadow-sm border-4 border-white mt-4 bg-stone-200 aspect-[4/3]">
                      <img 
                        src={step.img} 
                        alt={`Step ${step.num}`}
                        className="w-full h-full object-cover"
                      />
                   </div>
                 </div>
               ))}
            </div>

          </div>
        </section>

        {/* Instructor Section */}
        {/* ★修正: id="instructor" を追加 */}
        <section className="py-20 bg-white" id="instructor">
          <div className="text-center px-4 max-w-md mx-auto">

            <h3 className="text-[#EEA51A] font-bold text-lg mb-1 font-sans tracking-wide">Instructor</h3>
            <h2 className="text-xl font-bold tracking-widest text-stone-800 mb-10">講師</h2>
            
            {/* 1. プロフィール写真 */}
            <div className="mb-8 max-w-[320px] mx-auto">
               <img 
                 src="/img/instructor01.jpg" 
                 alt="小林哲朗" 
                 className="w-full h-auto object-cover rounded-2xl shadow-lg" 
               />
            </div>

            {/* 2. 名前 */}
            <div className="mb-6 text-[#0F2849]">
               <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                 <h3 className="font-bold text-2xl tracking-widest">小林哲朗</h3>
                 <span className="font-bold text-xs tracking-[0.2em] font-sans mt-1 text-stone-500 sm:text-[#0F2849]">TETSURO KOBAYASHI</span>
               </div>
            </div>

            {/* 3. バッジ */}
            <div className="flex justify-center gap-3 mb-10">
               <div className="w-25 h-25">
                  <img 
                    src="/img/ryt200.png" 
                    alt="RYT200"
                    className="w-full h-full object-contain drop-shadow-sm"
                  />
               </div>
               <div className="w-25 h-25">
                  <img 
                    src="/img/e-ryt500.png" 
                    alt="E-RYT500"
                    className="w-full h-full object-contain drop-shadow-sm"
                  />
               </div>
            </div>

            {/* 4. 資格リスト */}
            <div className="relative inline-block text-left bg-white px-10 py-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(238,165,26,0.15)] mb-12 border-2 border-[#EEA51A]/20 mt-4">
               {/* 上部のラベル */}
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#EEA51A] text-white text-[10px] font-bold px-4 py-1 rounded-full tracking-widest shadow-sm border-2 border-white">
                 QUALIFICATION
               </div>
               
               <ul className="space-y-3 text-sm font-bold text-stone-700 tracking-wide leading-relaxed">
                  <li className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FFF8E1] text-[#EEA51A] text-xs">
                      ✓
                    </span>
                    全米ヨガアライアンスRYT500
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FFF8E1] text-[#EEA51A] text-xs">
                      ✓
                    </span>
                    古典ハタヨガ浄化法講師
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FFF8E1] text-[#EEA51A] text-xs">
                      ✓
                    </span>
                    瞑想講師
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FFF8E1] text-[#EEA51A] text-xs">
                      ✓
                    </span>
                    ヨガ指導歴13年
                  </li>
               </ul>
            </div>

            {/* 5. クラス風景写真 */}
            <div className="mb-6">
               <img src="/img/instructor02.jpg" alt="Lesson" className="w-full h-auto object-cover" />
            </div>

            {/* 6. 紹介文 (前半) */}
            <div className="text-left text-xs leading-loose text-stone-800 font-medium mb-10 text-justify tracking-wider">
               <p>
                 フィリピン駐在中にPascale Wettsteinより師事を受け、身体の力学を重視したアジャストやプロップスの使い方、シークエンスの作り方を学びました。後にインドへ行き、哲学や瞑想、ヨガの解剖学、アーユルヴェーダの生理学について学び、二大古典ヨガであるハタヨガとアシュタンガヨガを日々実践。瞑想や哲学、解剖学の知識に基づく体と心に届くレッスンを提供しています。
               </p>
            </div>

            {/* 7. 指導風景写真 */}
            <div className="mb-10">
               <img src="/img/instructor03.jpg" alt="Teaching" className="w-full h-auto object-cover" />
            </div>

            {/* 8. 紹介文 (後半・ヒストリー) */}
            <div className="relative w-full rounded-xl overflow-hidden shadow-sm">
               {/* 背景画像 */}
               <div className="absolute inset-0">
                  <img 
                    src="/img/bg-history.jpg" 
                    alt="Background" 
                    className="w-full h-full object-cover" 
                  />
               </div>

               {/* テキストコンテンツ */}
               <div className="relative z-10 p-8 text-left space-y-6 text-xs leading-loose text-white font-medium text-justify tracking-wide">
                   <p>
                     私自身、ヨガを始める前は顎関節症に伴う慢性頭痛と不眠の症状に悩まされていました。フィリピン駐在中に現地のヨガスタジオで初めてヨガをした後、それまでズーンと頭に常にあった痛みがスッキリとれ今までにないほど視界がクリアになりました。自分にはヨガが合っていると思い日々ヨガに打ち込むように。
                   </p>
                   <p>
                     そこでPascale Wettsteinより師事を受け、身体の力学に基づいたヨガを学びました。その後、インドへ行き、インドの先生方からアーサナ、呼吸法、瞑想法を通して身体の不調を取り去るインド古来の叡智を学び、哲学を通して物事を見る視点や考え方を学びました。
                   </p>
                   <p>
                     持病に回帰性リウマチがあり痛みで身体が自由に動かない日もありますが、痛いからこそわかる、不調を抱える人に寄り添ったヨガを心がけています。身体に痛みがある場合は道具を使って軽減したりアーサナの形をその方に合ったものに変更したりすることで、無理なくヨガの効果の恩恵を受けられます。年齢を重ねるにつれて現れる身体の不調や可動域の変化をヨガを続けることで少しずつ改善していきましょう。
                   </p>
               </div>
            </div>

          </div>
        </section>

        {/* Schedule Section */}
        <section className="py-16 bg-[#F7F5F0]" id="schedule">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10">
              <h3 className="text-[#EEA51A] font-bold text-lg mb-1 font-sans tracking-wide">Schedule</h3>
              <h2 className="text-xl font-bold tracking-widest text-stone-700">スケジュール</h2>
            </div>
            <ScheduleSection schedules={schedules} />
          </div>
        </section>
      </div>
    </div>
  );
}