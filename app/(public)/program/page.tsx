import Link from 'next/link';

export default function ProgramPage() {
  return (
    <div className="min-h-screen w-full bg-[#F0EBE0] text-stone-800 font-sans">

      <main className="pb-24">
        {/* ▼▼▼ FV / Title Section (修正：左右パディング追加) ▼▼▼ */}
        <section className="bg-[#F0EBE0] pt-12 pb-16">
          {/* コンテナに px-5 (20px) を追加し、内部要素の余計な余白を削除しました */}
          <div className="max-w-2xl mx-auto px-5">
            
            {/* 1. ヘッダータイトル部分 */}
            <div className="text-center mb-6 relative">
              <h1 className="text-2xl md:text-3xl font-bold tracking-widest text-stone-900 mb-2">
                全米ヨガアライアンスRYT200
              </h1>
              
              <div className="flex items-center justify-center gap-4">
                <span className="text-xl md:text-2xl font-bold text-stone-800 tracking-wider">
                  ヨガ指導者養成講座
                </span>
                {/* RYTロゴ */}
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#EEA51A]">
                   <img src="/img/ryt200.png" alt="RYT200" className="w-12 h-auto object-contain" />
                </div>
              </div>
            </div>

            {/* 2. 黒帯インフォメーション */}
            <div className="bg-black text-white text-center py-3 font-bold tracking-widest text-sm md:text-lg mb-0 shadow-md">
              次回2026年7月開講 受講生募集中
            </div>

            {/* 3. メイン画像 */}
            <div className="w-full mx-auto mb-10">
              <div className="w-full aspect-[4/3] relative overflow-hidden shadow-lg bg-stone-200">
                 <img 
                   src="/img/instructor02.jpg" 
                   alt="RYT200 Training Class" 
                   className="w-full h-full object-cover" 
                 />
              </div>
            </div>

            {/* 4. キャッチコピーと本文 */}
            <div className="space-y-12">
              
              {/* ブロック1 */}
              <div className="text-left">
                <h2 className="text-xl md:text-2xl font-bold text-stone-900 mb-4 leading-relaxed">
                  <span className="bg-gradient-to-t from-[#EEA51A] via-[#EEA51A] to-transparent bg-[length:100%_35%] bg-no-repeat bg-bottom px-1">
                    初心者でも安心。
                  </span>
                  <br className="md:hidden" />
                  <span className="bg-gradient-to-t from-[#EEA51A] via-[#EEA51A] to-transparent bg-[length:100%_35%] bg-no-repeat bg-bottom px-1 md:ml-2">
                    伝統ヨガを一から丁寧に。
                  </span>
                </h2>
                <p className="text-sm md:text-base leading-loose font-medium text-stone-700">
                  インドの伝統的ヨガを、初心者や体の硬い方でも安心して学べるよう、やさしく丁寧に指導。基礎からしっかり身につく構成だからこそ、初めてでも深い学びが得られます。
                </p>
              </div>

              {/* ブロック2 */}
              <div className="text-left">
                <h2 className="text-xl md:text-2xl font-bold text-stone-900 mb-4 leading-relaxed">
                  <span className="bg-gradient-to-t from-[#EEA51A] via-[#EEA51A] to-transparent bg-[length:100%_35%] bg-no-repeat bg-bottom px-1">
                    流行ではなく、本質を学ぶ。
                  </span>
                  <br />
                  <span className="bg-gradient-to-t from-[#EEA51A] via-[#EEA51A] to-transparent bg-[length:100%_35%] bg-no-repeat bg-bottom px-1">
                    ヨガの源流インド古典ヨガを学べる
                  </span>
                  <br className="md:hidden" />
                  <span className="bg-gradient-to-t from-[#EEA51A] via-[#EEA51A] to-transparent bg-[length:100%_35%] bg-no-repeat bg-bottom px-1">
                    カリキュラム。
                  </span>
                </h2>
                <p className="text-sm md:text-base leading-loose font-medium text-stone-700">
                  ヨガの源流であるインド古典ヨガを学ぶことでブレない確かな知識を身につけることができます。
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ▼▼▼ Curriculum Section ▼▼▼ */}
        <section className="max-w-3xl mx-auto px-6 py-20">
            <div className="text-center mb-20 relative">
                <span className="text-[#EEA51A] font-bold text-5xl md:text-6xl font-serif italic opacity-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none">Curriculum</span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-widest text-stone-800 relative z-10">カリキュラム</h2>
            </div>

            <div className="space-y-24">
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
                <CurriculumCard 
                    number="02" 
                    title="ヨガ哲学" 
                    icon="/img/program02.png"
                    description="インドの哲学講師から直接学んだヨガ哲学をヨガの経典である「パタンジャリのヨガ・スートラ」を用いて詳しく解説します。難しく分かりづらい経典を、日常に起こりうる例えを使いながら分かりやすく読み解いていきます。幸福を感じる手助けとなり、より充実した、意義のある人生を送る道しるべとなります。"
                    list={[
                        "ヨガとは（歴史、種類）",
                        "一元論、二元論",
                        "ヨガの八支則",
                        "ナーディ",
                        "マントラ（瞑想のマントラ、修練のマントラ、プラーナヤマのマントラ、平和のマントラ、グルのマントラ、魂のマントラ、スーリヤナマスカーラマントラ）",
                        "プラーナ",
                        "バンダ",
                        "パンチャコーシャ",
                        "クンダリニー",
                        "ムドラー",
                        "チャクラ"
                    ]}
                />
                <CurriculumCard 
                    number="03" 
                    title="アーサナと指導法" 
                    icon="/img/program03.png"
                    image="/img/program03_2.jpg"
                    description="60種類以上のアーサナについて、アライメント、アジャスト法、効果、禁忌、軽減法、プロップスの使い方を実践を通して学びます。確かな知識を身につけることで迷いのない安全な指導ができます。"
                    list={[
                        "レッスンの構成（解剖学的理由のあるシークエンスの作り方）",
                        "アジャストメント（直接、受講生の身体に触れて心身を調整する手法）",
                        "話し方",
                        "プロップス（補助具）の使い方と目的",
                        "実践的な指導法について",
                        "軽減法やヴァリエーションを加えたポーズ（受講者に合わせて異なるポーズを指導）"
                    ]}
                />
                <CurriculumCard 
                    number="04" 
                    title="解剖学と生理学" 
                    icon="/img/program04.png"
                    image="/img/program04_2.jpg"
                    description="アーサナとプラーナヤーマによる、循環器、呼吸器、消化器、骨格、筋肉、内分泌系への効果について学びます。解剖学では、骨格、筋、関節について学び、安全な可動域について怪我をさせない指導法を身につけます。"
                    list={[
                        "神経系、分泌系、消化器官系、呼吸器官系、身体の仕組み（ヨガをすることによる影響）",
                        "骨の構造と仕組みと骨格系",
                        "関節（膝、肩、手首、足首、股関節）",
                        "筋組織と主要な筋肉について"
                    ]}
                />
                <CurriculumCard 
                    number="05" 
                    title="アーユルヴェーダ" 
                    icon="/img/program05.png"
                    description="アーユルヴェーダと生理学に基づいたヨギーの食事法を学びます。ドーシャ診断 / あなたがどのドーシャに属していて、どのようなライフスタイルが適しているかを診断します。３つのグナ（性質）の食べ物について理解を深め、食事が心と体に与える影響について学びます。（サトビック・フード/ラジャスティック・フード/タマスティック・フード）"
                />
                <CurriculumCard 
                    number="06" 
                    title="クリヤ（浄化法）" 
                    icon="/img/program06.png"
                    description="クリヤとは、体内と体外を浄化するための伝統的なヨガのデトックス法です。効果を理解した後に、講師の指導で浄化法を体験していただきます。 浄化法を行うことで、より深い瞑想と呼吸法を経験することができます。インドでは「ヨガをする前に必ずやりなさい」と言われるほど大切なものです。"
                    list={[
                        "ジャラネティ+スートネティ（鼻腔、咽頭洗浄）",
                        "カパルバティ（肺、胸腔、脳、おでこの洗浄）",
                        "トラタカ（目、心の浄化）",
                        "ヴァマンダウティ（食道、胃の浄化法）",
                        "ナウリ（腹腔の浄化）",
                        "バスティ（腸の浄化）",
                        "シャンクプラクシャラン（消化管全体の洗浄）"
                    ]}
                    note="※その都度、実践する浄化法は違いますのでご了承ください。"
                />
            </div>
        </section>

        {/* ▼▼▼ Schedule & Price & Contact Section ▼▼▼ */}
        <section className="bg-[#F0EBE0] pb-20">
            <div className="max-w-xl mx-auto px-6 space-y-16">
                
                {/* 開催スケジュール */}
                <div>
                    <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-2">
                        <span className="w-3 h-3 bg-stone-800 flex-shrink-0"></span>
                        <h2 className="text-lg font-bold text-stone-800 tracking-wider">開催スケジュール</h2>
                    </div>
                    <div className="bg-black text-white text-center py-2 font-bold text-xl tracking-widest shadow-sm">
                        2026年7月
                    </div>
                </div>

                {/* 受講料 */}
                <div>
                    <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-2">
                        <span className="w-3 h-3 bg-stone-800 flex-shrink-0"></span>
                        <h2 className="text-lg font-bold text-stone-800 tracking-wider">受講料</h2>
                    </div>
                    
                    <p className="text-center text-sm font-bold text-stone-700 mb-4 tracking-wider">
                        認定料・テキスト・修了証発行料　込み
                    </p>

                    <div className="bg-white p-10 text-center shadow-sm mb-6">
                        <div className="inline-block border border-stone-800 rounded-full px-8 py-1 text-sm font-bold text-stone-800 mb-4">
                            受講料
                        </div>
                        <div className="text-3xl md:text-4xl font-bold text-stone-900 mb-2 tracking-wider">
                            438,000円 <span className="text-lg font-normal">（税抜）</span>
                        </div>
                        <p className="text-stone-400 text-sm">税込 481,800円</p>
                    </div>

                    <ul className="list-none space-y-1 text-xs text-stone-700 leading-relaxed font-medium pl-1">
                        <li>※ お振込みまたは現金にてお支払いいただけます。</li>
                        <li>※ 分割払いもできますので、ご相談ください。</li>
                        <li>※ 応募人数により開校日が遅れる可能性もございます。</li>
                        <li>※ 定員になり次第受付を終了させていただきます。</li>
                    </ul>
                </div>

                {/* お申し込み・お問い合わせ */}
                <div>
                    <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-2">
                        <span className="w-3 h-3 bg-stone-800 flex-shrink-0"></span>
                        <h2 className="text-lg font-bold text-stone-800 tracking-wider">お申し込み・お問い合わせ</h2>
                    </div>

                    <div className="bg-white p-10 text-center shadow-sm mb-8">
                        {/* Mail */}
                        <div className="mb-8">
                            <div className="inline-block border border-stone-800 rounded-full px-10 py-1 text-sm font-bold text-stone-800 mb-3">
                                メール
                            </div>
                            <a href="mailto:info@ananda-yogaschool.com" className="block text-lg md:text-xl font-serif text-stone-800 tracking-wide hover:text-[#EEA51A] transition break-all">
                                info@ananda-yogaschool.com
                            </a>
                        </div>

                        {/* Tel */}
                        <div>
                            <div className="inline-block border border-stone-800 rounded-full px-10 py-1 text-sm font-bold text-stone-800 mb-3">
                                電話
                            </div>
                            <a href="tel:0278982667" className="block text-2xl md:text-3xl font-bold text-[#0033CC] tracking-wider hover:opacity-70 transition font-serif">
                                027-898-2667
                            </a>
                        </div>
                    </div>

                    <div className="space-y-4 text-xs md:text-sm text-stone-700 leading-loose font-medium">
                        <p>
                            レッスン等で、一度では繋がらない場合がございますので、ご了承ください。
                        </p>
                        <p>
                            ご不明点や相談したいことなどのある方は、事前にオンラインでの無料相談も可能です。
                        </p>
                    </div>
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
        <div className="flex flex-col gap-4">
            {/* Header: Number & Title */}
            <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl md:text-6xl font-serif text-[#EEA51A] leading-none">
                    {number}
                </span>
                <div className="flex items-center gap-3 pt-2">
                    <h3 className="text-xl md:text-2xl font-bold text-stone-800">
                        {title}
                    </h3>
                    <img src={icon} alt="" className="w-8 h-8 object-contain" />
                </div>
            </div>
            
            {/* Description */}
            <p className="text-sm md:text-base leading-loose text-stone-800 font-medium text-justify mb-2">
                {description}
            </p>

            {/* List Box (Bordered) */}
            {list && (
                <div className="border border-stone-600 px-6 py-5 bg-transparent mb-4">
                    <ul className="list-disc pl-4 space-y-2 text-stone-800 text-sm md:text-base font-medium leading-relaxed">
                        {list.map((item, i) => (
                            <li key={i} className="pl-1">{item}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* Note */}
            {note && (
                <p className="text-xs text-stone-500 text-right -mt-2 mb-2">{note}</p>
            )}

            {/* Main Image */}
            {image && (
                <div className="w-full mt-2">
                    <img 
                        src={image} 
                        alt={title} 
                        className="w-full h-auto aspect-video object-cover" 
                    />
                </div>
            )}
        </div>
    );
}