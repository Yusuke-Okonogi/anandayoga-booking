import Link from 'next/link';

export default function ProgramPage() {
  return (
    <div className="min-h-screen w-full bg-[#F9F8F6] text-stone-700 font-sans">

      <main className="pb-24">
        {/* ▼▼▼ FV / Title Section (オレンジ背景・白文字) ▼▼▼ */}
        <section className="bg-[#EEA51A] py-16 px-4 text-white text-center relative overflow-hidden">
          {/* 背景の装飾（薄いパターンなどがあればここに配置） */}
          
          <div className="max-w-4xl mx-auto relative z-10">
            <p className="text-sm md:text-base font-bold tracking-wider mb-4 opacity-90">
              全米ヨガアライアンス認定
            </p>
            
            <div className="flex flex-col items-center justify-center mb-8">
               <h1 className="text-3xl md:text-5xl font-bold tracking-widest text-white drop-shadow-sm mb-4 leading-tight">
                 RYT200<br/>
                 <span className="text-2xl md:text-4xl">ヨガ指導者養成講座</span>
               </h1>
               
               {/* RYTロゴ (白抜き加工が必要ですが、ここではフィルタで明るく調整) */}
               <div className="flex gap-4 items-center justify-center bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                  <img src="/img/ryt200.png" alt="RYT200" className="h-16 w-auto object-contain brightness-0 invert" />
                  <img src="/img/yoga_alliance.png" alt="Yoga Alliance" className="h-12 w-auto object-contain brightness-0 invert" />
               </div>
            </div>
            
            {/* 開講情報バナー */}
            <div className="inline-block bg-white text-[#EEA51A] px-6 py-3 md:px-10 md:py-4 rounded-full font-bold text-lg md:text-xl tracking-widest shadow-lg transform translate-y-2">
              次回 <span className="text-2xl md:text-3xl font-serif">2026</span>年 <span className="text-2xl md:text-3xl font-serif">7</span>月開講 <span className="text-sm md:text-base ml-2 bg-[#EEA51A] text-white px-2 py-0.5 rounded">受講生募集中</span>
            </div>
          </div>
        </section>

        {/* ▼▼▼ Intro Section ▼▼▼ */}
        <section className="max-w-4xl mx-auto px-4 py-20">
            <div className="mb-16 rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                <img src="/img/instructor02.jpg" alt="Instructor" className="w-full h-auto object-cover" />
            </div>

            <div className="space-y-12">
                {/* Intro 1 */}
                <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-stone-100 text-center relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-1 bg-[#EEA51A] rounded-full"></div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#EEA51A] mb-6 leading-relaxed">
                        初心者でも安心。<br/>伝統ヨガを一から丁寧に。
                    </h2>
                    <p className="leading-loose text-sm md:text-base text-justify md:text-center text-stone-600 font-medium">
                        インドの伝統的ヨガを、初心者や体の硬い方でも安心して学べるよう、やさしく丁寧に指導。<br className="hidden md:block"/>
                        基礎からしっかり身につく構成だからこそ、初めてでも深い学びが得られます。
                    </p>
                </div>

                {/* Intro 2 */}
                <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-stone-100 text-center relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-1 bg-[#EEA51A] rounded-full"></div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#EEA51A] mb-6 leading-relaxed">
                        流行ではなく、本質を学ぶ。<br/>ヨガの源流インド古典ヨガを学べるカリキュラム。
                    </h2>
                    <p className="leading-loose text-sm md:text-base text-justify md:text-center text-stone-600 font-medium">
                        ヨガの源流であるインド古典ヨガを学ぶことで<br className="hidden md:block"/>
                        ブレない確かな知識を身につけることができます。
                    </p>
                </div>
            </div>
        </section>

        {/* ▼▼▼ Curriculum Section ▼▼▼ */}
        <section className="max-w-4xl mx-auto px-4 pb-20">
            <div className="text-center mb-16 relative">
                <span className="text-[#EEA51A] font-bold text-5xl md:text-6xl font-serif italic opacity-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none">Curriculum</span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-widest text-stone-800 relative z-10">カリキュラム</h2>
            </div>

            <div className="space-y-16">
                {/* 01 */}
                <CurriculumCard 
                    number="01" 
                    title="呼吸法と瞑想法" 
                    icon="/img/program01.png"
                    image="/img/program01_2.jpg"
                    description="瞑想のテクニックを確実に身に着けるためには、瞑想の目的や効果、種類についての理解が必要です。瞑想時の呼吸法と瞑想法を実践し、心の動きをコントロールし、心身をリラックスさせる術を身に着けます。"
                    list={[
                        "瞑想の目的と効果、 様々な種類の瞑想（チャクラ瞑想、トラタカ瞑想など）",
                        "呼吸法の説明と実践（アヌローマヴィローマ、ウジャイ、ブラマリ、シータリ、シートカリー、バストリカなど）"
                    ]}
                />

                {/* 02 */}
                <CurriculumCard 
                    number="02" 
                    title="ヨガ哲学" 
                    icon="/img/program02.png"
                    description="インドの哲学講師から直接学んだヨガ哲学をヨガの経典である「パタンジャリのヨガ・スートラ」を用いて詳しく解説します。難しく分かりづらい経典を、日常に起こりうる例えを使いながら分かりやすく読み解いていきます。幸福を感じる手助けとなり、より充実した、意義のある人生を送る道しるべとなります。"
                    list={[
                        "ヨガとは（歴史、種類）/ 一元論、二元論",
                        "ヨガの八支則 / ナーディ / マントラ",
                        "プラーナ / バンダ / パンチャコーシャ",
                        "クンダリニー / ムドラー / チャクラ"
                    ]}
                />

                {/* 03 */}
                <CurriculumCard 
                    number="03" 
                    title="アーサナと指導法" 
                    icon="/img/program03.png"
                    image="/img/program03_2.jpg"
                    description="60種類以上のアーサナについて、アライメント、アジャスト法、効果、禁忌、軽減法、プロップスの使い方を実践を通して学びます。確かな知識を身につけることで迷いのない安全な指導ができます。"
                    list={[
                        "レッスンの構成（解剖学的理由のあるシークエンスの作り方）",
                        "アジャストメント（直接、受講生の身体に触れて心身を調整する手法）",
                        "話し方 / プロップス（補助具）の使い方と目的",
                        "実践的な指導法について / 軽減法やヴァリエーションを加えたポーズ"
                    ]}
                />

                {/* 04 */}
                <CurriculumCard 
                    number="04" 
                    title="解剖学と生理学" 
                    icon="/img/program04.png"
                    image="/img/program04_2.jpg"
                    description="アーサナとプラーナヤーマによる、循環器、呼吸器、消化器、骨格、筋肉、内分泌系への効果について学びます。解剖学では、骨格、筋、関節について学び、安全な可動域について怪我をさせない指導法を身につけます。"
                    list={[
                        "神経系、分泌系、消化器官系、呼吸器官系",
                        "身体の仕組み（ヨガをすることによる影響）",
                        "骨の構造と仕組みと骨格系 / 関節（膝、肩、手首、足首、股関節）",
                        "筋組織と主要な筋肉について"
                    ]}
                />

                {/* 05 */}
                <CurriculumCard 
                    number="05" 
                    title="アーユルヴェーダ" 
                    icon="/img/program05.png"
                    description="アーユルヴェーダと生理学に基づいたヨギーの食事法を学びます。ドーシャ診断 / あなたがどのドーシャに属していて、どのようなライフスタイルが適しているかを診断します。３つのグナ（性質）の食べ物について理解を深め、食事が心と体に与える影響について学びます。（サトビック・フード/ラジャスティック・フード/タマスティック・フード）"
                />

                {/* 06 */}
                <CurriculumCard 
                    number="06" 
                    title="クリヤ（浄化法）" 
                    icon="/img/program06.png"
                    description="クリヤとは、体内と体外を浄化するための伝統的なヨガのデトックス法です。効果を理解した後に、講師の指導で浄化法を体験していただきます。 浄化法を行うことで、より深い瞑想と呼吸法を経験することができます。インドでは「ヨガをする前に必ずやりなさい」と言われるほど大切なものです。"
                    list={[
                        "ジャラネティ+スートネティ（鼻腔、咽頭洗浄）",
                        "カパルバティ（肺、胸腔、脳、おでこの洗浄）/ トラタカ（目、心の浄化）",
                        "ヴァマンダウティ（食道、胃の浄化法）/ ナウリ（腹腔の浄化）/ バスティ（腸の浄化）",
                        "シャンクプラクシャラン（消化管全体の洗浄）"
                    ]}
                    note="※その都度、実践する浄化法は違いますのでご了承ください。"
                />
            </div>
        </section>

        {/* ▼▼▼ Schedule & Price Section ▼▼▼ */}
        <section className="bg-white py-20 px-4 rounded-t-[50px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="max-w-3xl mx-auto">
                
                {/* 開催スケジュール */}
                <div className="mb-20 text-center">
                     <div className="inline-block border-2 border-stone-800 text-stone-800 px-10 py-2 rounded-full text-base font-bold tracking-widest mb-8">開催スケジュール</div>
                     <div className="bg-[#FFFDF9] p-10 rounded-[30px] shadow-sm border border-[#F5EAD7]">
                         <h2 className="text-4xl font-bold text-[#EEA51A] tracking-wider mb-2 font-serif">2026年7月</h2>
                         <p className="text-stone-500 text-sm font-medium">詳細な日程はお問い合わせください</p>
                     </div>
                </div>

                {/* 受講料 */}
                <div className="text-center mb-20">
                     <div className="inline-block border-2 border-stone-800 text-stone-800 px-10 py-2 rounded-full text-base font-bold tracking-widest mb-4">受講料</div>
                     <p className="text-sm font-bold mb-8 text-stone-500">認定料・テキスト・修了証発行料　込み</p>
                     
                     <div className="bg-[#FFFDF9] p-12 rounded-[30px] shadow-sm border border-[#F5EAD7] mb-8 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-2 bg-[#EEA51A]"></div>
                         <div className="text-base font-bold text-stone-500 mb-2">受講料</div>
                         <div className="text-4xl md:text-5xl font-bold text-stone-800 mb-2 tracking-tight font-serif">
                             438,000<span className="text-xl md:text-2xl font-normal ml-1 font-sans">円（税抜）</span>
                         </div>
                         <div className="text-sm font-bold text-[#EEA51A]">税込 481,800円</div>
                     </div>

                     <div className="text-xs text-stone-500 bg-stone-50 p-6 rounded-2xl text-left inline-block w-full">
                        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                            <li>お振込みまたは現金にてお支払いいただけます。</li>
                            <li>分割払いもできますので、ご相談ください。</li>
                            <li>応募人数により開校日が遅れる可能性もございます。</li>
                            <li>定員になり次第受付を終了させていただきます。</li>
                        </ul>
                     </div>
                </div>

                {/* お申し込み・お問い合わせ */}
                <div className="text-center">
                     <div className="inline-block border-2 border-stone-800 text-stone-800 px-8 py-2 rounded-full text-base font-bold tracking-widest mb-10">お申し込み・お問い合わせ</div>
                     
                     <div className="grid md:grid-cols-2 gap-6 mb-10">
                         {/* メール */}
                         <a href="mailto:info@ananda-yogaschool.com" className="group bg-white p-8 rounded-[30px] shadow-sm border border-stone-100 hover:border-[#EEA51A] hover:shadow-md transition duration-300 flex flex-col items-center justify-center h-full">
                             <div className="text-sm font-bold text-[#EEA51A] mb-2 flex items-center gap-2">
                                 <span className="text-lg">✉️</span> メール
                             </div>
                             <span className="text-sm font-bold text-stone-700 group-hover:text-[#EEA51A] transition break-all">
                                 info@ananda-yogaschool.com
                             </span>
                         </a>

                         {/* 電話 */}
                         <a href="tel:0278982667" className="group bg-white p-8 rounded-[30px] shadow-sm border border-stone-100 hover:border-[#EEA51A] hover:shadow-md transition duration-300 flex flex-col items-center justify-center h-full">
                             <div className="text-sm font-bold text-[#EEA51A] mb-2 flex items-center gap-2">
                                 <span className="text-lg">📞</span> 電話
                             </div>
                             <span className="text-2xl font-bold text-stone-700 group-hover:text-[#EEA51A] transition font-serif tracking-wider">
                                 027-898-2667
                             </span>
                         </a>
                     </div>
                     
                     <p className="text-xs text-stone-400 leading-loose">
                         レッスン等で、一度では繋がらない場合がございますので、ご了承ください。<br/>
                         ご不明点や相談したいことなどのある方は、事前にオンラインでの無料相談も可能です。
                     </p>
                </div>
            </div>
        </section>

      </main>

    </div>
  );
}

// ▼▼▼ Sub Component: Curriculum Card ▼▼▼
function CurriculumCard({ number, title, icon, image, description, list, note }: {
    number: string;
    title: string;
    icon: string;
    image?: string;
    description: string;
    list?: string[];
    note?: string;
}) {
    return (
        <div className="bg-white rounded-[30px] p-6 md:p-10 shadow-md border border-stone-50 overflow-hidden">
            <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                {/* Number Design */}
                <div className="flex-shrink-0 relative mt-1">
                   <span className="text-5xl md:text-6xl font-bold text-[#EEA51A] font-serif leading-none relative z-10">{number}</span>
                   <span className="absolute top-1 left-1 text-5xl md:text-6xl font-bold text-[#FDF5E6] font-serif leading-none -z-10">{number}</span>
                </div>
                
                <div className="flex-1 w-full">
                   <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-[#F5EAD7]">
                       <h3 className="text-xl md:text-2xl font-bold text-stone-800">{title}</h3>
                       <img src={icon} alt="Icon" className="w-8 h-8 object-contain ml-auto md:ml-0" />
                   </div>
                   
                   <p className="leading-loose text-sm text-stone-600 text-justify mb-6">
                       {description}
                   </p>

                   {list && (
                       <div className="bg-[#FFFDF9] p-6 rounded-2xl text-xs md:text-sm leading-loose border border-[#F5EAD7] mb-6">
                           <ul className="list-disc pl-5 space-y-1 text-stone-600">
                               {list.map((item, i) => (
                                   <li key={i}>{item}</li>
                               ))}
                           </ul>
                       </div>
                   )}
                   
                   {note && (
                       <p className="text-[10px] text-stone-400 text-right mb-2">{note}</p>
                   )}

                   {image && (
                       <img src={image} alt={title} className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-sm hover:shadow-md transition duration-300" />
                   )}
                </div>
            </div>
        </div>
    );
}