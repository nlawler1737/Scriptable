
let fm = FileManager.iCloud()
log((await getCSS()).length)
let selectedFile = await presentTable()

if (!selectedFile) return

let selectedDoc = fm.joinPath(fm.documentsDirectory(),selectedFile)
log(selectedDoc)

//return 
//let selectedDoc = (await DocumentPicker.open(["com.netscape.javascript-source"]))[0]

if (fm.fileExtension(selectedDoc)!="js") throw "Must Be '.js' Extension"

let docText = await fm.readString(selectedDoc)

let matchGlyph = docText.match(/icon-glyph: ([\w-]+);/)
let matchColor = docText.match(/icon-color: ([\w-]+);/)

let selectedItems = await presentIconPicker(matchColor[1],matchGlyph[1],fm.fileName(selectedDoc))

if (selectedItems.glyph) {  
  docText = docText.replace(matchGlyph[0], `icon-glyph: ${selectedItems.glyph};`)
}
if (selectedItems.color) {
  docText = docText.replace(matchColor[0], `icon-color: ${selectedItems.color};`)
}

if (selectedItems.color||selectedItems.glyph) fm.writeString(selectedDoc, docText)


async function presentIconPicker(co,ic,name) {

  let iconGlyphs = ""
  let iconColors = ""
  let colors = {
    "red":"rgb(218, 78, 62)",
    "pink":"rgb(218, 64, 108)",
    "purple":"rgb(156, 55, 186)",
    "deep-purple":"rgb(110, 71, 191)",
    "deep-blue":"rgb(83, 95, 195)",
    "blue":"rgb(81, 148, 230)",
    "cyan":"rgb(92, 184, 207)",
    "teal":"rgb(86, 166, 155)",
    "deep-green":"rgb(109, 186, 94)",
    "green":"rgb(158, 196, 101)",
    "yellow":"rgb(233, 190, 82)",
    "orange":"rgb(231, 154, 64)",
    "light-brown":"rgb(168, 112, 78)",
    "brown":"rgb(143, 83, 55)",
    "deep-brown":"rgb(108, 70, 39)",
    "light-gray":"rgb(133, 134, 144)",
    "gray":"rgb(106, 109, 120)",
    "deep-gray":"rgb(70, 76, 82)"
  }
  
  let icons = iconNames()
  
  ic = icons.includes(ic) ? ic : "magic"

  for (i=0;i<icons.length;i++) {
    iconGlyphs+=`
    <i style="width:15vw;height:15vw;font-size:10vw;" class="fa fa-${icons[i]} fa-pulse" aria-hidden="true" onclick="selectIcon(this)" iconName="${icons[i]}"></i>`
  }
  
  let colorKeys=Object.keys(colors)
  let colorVals=Object.values(colors)
  iconColors+="<div style='margin-top:20px;'>"
  for (i in colorKeys) {
    iconColors+=`<color style="background:${colorVals[i]};margin:10px;width:30vw;height:10vw;color:white;display:inline-block;border-radius:10px;" onclick="selectColor(this)" iconColor="${colorKeys[i]}"></color>`
  }
  iconColors+="</div>"

  let wv = new WebView()
  let html = `<!DOCTYPE html>
  <html>
  <head>
  <title>Test</title>
  <!--<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">-->
  <style>${await getCSS()}</style>
  <style>#chosenIcon{color:limegreen}#chosenColor{box-shadow:limegreen 0 0 0px 10px;}</style>
  </head>
  <body style="margin:0;text-align:center;min-height:200vh;">
  <div style="height:20vw;width:90vw;background:${colors[co]||colors.yellow};color:white;padding:1vw;margin-left:4vw;border-radius:2vw" gotColor>
  
  <div><i style="width:15vw;height:15vw;font-size:10vw;float:left;margin-top:1.5vw;" class="fa fa-${ic}" aria-hidden="true" gotIcon></i></div>
  
  <div style="position:absolute;top:14vw;font-size:60px; font-family: Arial; font-weight:bold;margin-left:2vw;">${name}</div>
  </div>
  ${iconColors}
  <input style="height:100px; width:90vw; border-radius:50px;margin-top:50px;margin-bottom:50px;font-size:50px" placeholder="Search"></input>
  <div>
  ${iconGlyphs}
  <div>
  <script>  
    function selectIcon(element){
      let isSelected = element.id=="chosenIcon"?true:false
      document.querySelectorAll("#chosenIcon").forEach(e=>e.id = null);
      if(!isSelected) {  
        element.id='chosenIcon';
        let icon = element.getAttribute("iconName")
        let list = document.querySelector('[gotIcon]').classList
        list.value= 'fa fa-'+icon+' fa-1x'
      } else {
        let list = document.querySelector('[gotIcon]').classList
        list.value='fa fa-${ic} fa-1x'
      }
    }
    function selectColor(element){
      let isSelected = element.id=="chosenColor"?true:false
      document.querySelectorAll("#chosenColor").forEach(e=>e.id = null);
      if(!isSelected) {
       element.id='chosenColor';
       document.querySelector('[gotColor]').style.background=element.style.background
      } else {
        document.querySelector('[gotColor]').style.background='${colors[co]}'
      }
    }
    
    let input = document.querySelector("input")
    
    input.addEventListener("input",function(){
      console.log("Input")
      document.querySelectorAll("i[iconName]").forEach(ee=>{
        if ((ee.getAttribute("iconName")).includes(input.value.toLowerCase())) {
          ee.style.display = null
        } else {
          ee.style.display = "none"
        }
      })
    })
  </script>
  </body>
  </html>
  `
  wv.loadHTML(html)
  await wv.present(true)
  let wvRes = {}
  wvRes.glyph = await wv.evaluateJavaScript("try{document.querySelector('#chosenIcon').getAttribute('iconName')}catch(e){null}")
  wvRes.color = await wv.evaluateJavaScript("try{document.querySelector('#chosenColor').getAttribute('iconColor')}catch(e){null}")
  return wvRes
}

async function presentTable() {
  let files = fm.listContents(fm.documentsDirectory()).filter(e=>fm.fileExtension(e)=="js").sort((a,b)=>{return a.localeCompare(b)})

  let table = new UITable()
  let result
  for (i of files) {
    row = new UITableRow()
    row.addText(i)
    table.addRow(row)
    row.onSelect = (index) => {
      result = files[index]
    }
  }
  table.showSeparators = 1
  await table.present(false)
  return result
}

async function getCSS() {
  
  let p = fm.joinPath(fm.documentsDirectory(), "iconGlyphsCSS.txt")

  if (!fm.fileExists(p)) {
    let req = new Request("https://github.com/nlawler1737/Scriptable/raw/main/iconGlyphCss.txt");
    let res = await req.loadString();
    fm.writeString(p, res);
  }
  return fm.readString(p);
}

function iconNames(){
  return ["ad","address-book","address-card","adjust","air-freshener","align-center","align-justify","align-left","align-right","allergies","ambulance","american-sign-language-interpreting","anchor","angle-double-down","angle-double-left","angle-double-right","angle-double-up","angle-down","angle-left","angle-right","angle-up","angry","ankh","apple-alt","archive","archway","arrow-alt-circle-down","arrow-alt-circle-left","arrow-alt-circle-right","arrow-alt-circle-up","arrow-circle-down","arrow-circle-left","arrow-circle-right","arrow-circle-up","arrow-down","arrow-left","arrow-right","arrow-up","arrows-alt","arrows-alt-h","arrows-alt-v","assistive-listening-systems","asterisk","at","atlas","atom","audio-description","award","backspace","backward","balance-scale","ban","band-aid","barcode","bars","baseball-ball","basketball-ball","bath","battery-empty","battery-full","battery-half","battery-quarter","battery-three-quarters","bed","beer","bell","bell-slash","bezier-curve","bible","bicycle","binoculars","birthday-cake","blender","blind","bold","bolt","bomb","bone","bong","book","book-open","book-reader","bookmark","bowling-ball","box","box-open","boxes","braille","brain","briefcase","briefcase-medical","broadcast-tower","broom","brush","bug","building","bullhorn","bullseye","burn","bus","bus-alt","business-time","calculator","calendar","calendar-alt","calendar-check","calendar-minus","calendar-plus","calendar-times","camera","camera-retro","cannabis","capsules","car","car-alt","car-battery","car-crash","car-side","caret-down","caret-left","caret-right","caret-square-down","caret-square-left","caret-square-right","caret-square-up","caret-up","cart-arrow-down","cart-plus","certificate","chalkboard","chalkboard-teacher","charging-station","chart-area","chart-bar","chart-line","chart-pie","check","check-circle","check-double","check-square","chess","chess-bishop","chess-board","chess-king","chess-knight","chess-pawn","chess-queen","chess-rook","chevron-circle-down","chevron-circle-left","chevron-circle-right","chevron-circle-up","chevron-down","chevron-left","chevron-right","chevron-up","child","church","circle","circle-notch","city","clipboard","clipboard-check","clipboard-list","clock","clone","closed-captioning","cloud","cloud-download-alt","cloud-upload-alt","cocktail","code","code-branch","coffee","cog","cogs","coins","columns","comment","comment-alt","comment-dollar","comment-dots","comment-slash","comments","comments-dollar","compact-disc","compass","compress","concierge-bell","cookie","cookie-bite","copy","copyright","couch","credit-card","crop","crop-alt","cross","crosshairs","crow","crown","cube","cubes","cut","database","deaf","desktop","dharmachakra","diagnoses","dice","dice-five","dice-four","dice-one","dice-six","dice-three","dice-two","digital-tachograph","directions","divide","dizzy","dna","dollar-sign","dolly","dolly-flatbed","donate","door-closed","door-open","dot-circle","dove","download","drafting-compass","draw-polygon","drum","drum-steelpan","dumbbell","edit","eject","ellipsis-h","ellipsis-v","envelope","envelope-open","envelope-open-text","envelope-square","equals","eraser","euro-sign","exchange-alt","exclamation","exclamation-circle","exclamation-triangle","expand","expand-arrows-alt","external-link-alt","external-link-square-alt","eye","eye-dropper","eye-slash","fast-backward","fast-forward","fax","feather","feather-alt","female","fighter-jet","file","file-alt","file-archive","file-audio","file-code","file-contract","file-download","file-excel","file-export","file-image","file-import","file-invoice","file-invoice-dollar","file-medical","file-medical-alt","file-pdf","file-powerpoint","file-prescription","file-signature","file-upload","file-video","file-word","fill","fill-drip","film","filter","fingerprint","fire","fire-extinguisher","first-aid","fish","flag","flag-checkered","flask","flushed","folder","folder-minus","folder-open","folder-plus","font","football-ball","forward","frog","frown","frown-open","funnel-dollar","futbol","gamepad","gas-pump","gavel","gem","genderless","gift","glass-martini","glass-martini-alt","glasses","globe","globe-africa","globe-americas","globe-asia","golf-ball","gopuram","graduation-cap","greater-than","greater-than-equal","grimace","grin","grin-alt","grin-beam","grin-beam-sweat","grin-hearts","grin-squint","grin-squint-tears","grin-stars","grin-tears","grin-tongue","grin-tongue-squint","grin-tongue-wink","grin-wink","grip-horizontal","grip-vertical","h-square","hamsa","hand-holding","hand-holding-heart","hand-holding-usd","hand-lizard","hand-paper","hand-peace","hand-point-down","hand-point-left","hand-point-right","hand-point-up","hand-pointer","hand-rock","hand-scissors","hand-spock","hands","hands-helping","handshake","hashtag","hdd","heading","headphones","headphones-alt","headset","heart","heartbeat","helicopter","highlighter","history","hockey-puck","home","hospital","hospital-alt","hospital-symbol","hot-tub","hotel","hourglass","hourglass-end","hourglass-half","hourglass-start","i-cursor","id-badge","id-card","id-card-alt","image","images","inbox","indent","industry","infinity","info","info-circle","italic","jedi","joint","journal-whills","kaaba","key","keyboard","khanda","kiss","kiss-beam","kiss-wink-heart","kiwi-bird","landmark","language","laptop","laptop-code","laugh","laugh-beam","laugh-squint","laugh-wink","layer-group","leaf","lemon","less-than","less-than-equal","level-down-alt","level-up-alt","life-ring","lightbulb","link","lira-sign","list","list-alt","list-ol","list-ul","location-arrow","lock","lock-open","long-arrow-alt-down","long-arrow-alt-left","long-arrow-alt-right","long-arrow-alt-up","low-vision","luggage-cart","magic","magnet","mail-bulk","male","map","map-marked","map-marked-alt","map-marker","map-marker-alt","map-pin","map-signs","marker","mars","mars-double","mars-stroke","mars-stroke-h","mars-stroke-v","medal","medkit","meh","meh-blank","meh-rolling-eyes","memory","menorah","mercury","microchip","microphone","microphone-alt","microphone-alt-slash","microphone-slash","microscope","minus","minus-circle","minus-square","mobile","mobile-alt","money-bill","money-bill-alt","money-bill-wave","money-bill-wave-alt","money-check","money-check-alt","monument","moon","mortar-pestle","mosque","motorcycle","mouse-pointer","music","neuter","newspaper","not-equal","notes-medical","object-group","object-ungroup","oil-can","om","outdent","paint-brush","paint-roller","palette","pallet","paper-plane","paperclip","parachute-box","paragraph","parking","passport","pastafarianism","paste","pause","pause-circle","paw","peace","pen","pen-alt","pen-fancy","pen-nib","pen-square","pencil-alt","pencil-ruler","people-carry","percent","percentage","phone","phone-slash","phone-square","phone-volume","piggy-bank","pills","place-of-worship","plane","plane-arrival","plane-departure","play","play-circle","plug","plus","plus-circle","plus-square","podcast","poll","poll-h","poo","poop","portrait","pound-sign","power-off","pray","praying-hands","prescription","prescription-bottle","prescription-bottle-alt","print","procedures","project-diagram","puzzle-piece","qrcode","question","question-circle","quidditch","quote-left","quote-right","quran","random","receipt","recycle","redo","redo-alt","registered","reply","reply-all","retweet","ribbon","road","robot","rocket","route","rss","rss-square","ruble-sign","ruler","ruler-combined","ruler-horizontal","ruler-vertical","rupee-sign","sad-cry","sad-tear","save","school","screwdriver","search","search-dollar","search-location","search-minus","search-plus","seedling","server","shapes","share","share-alt","share-alt-square","share-square","shekel-sign","shield-alt","ship","shipping-fast","shoe-prints","shopping-bag","shopping-basket","shopping-cart","shower","shuttle-van","sign","sign-in-alt","sign-language","sign-out-alt","signal","signature","sitemap","skull","sliders-h","smile","smile-beam","smile-wink","smoking","smoking-ban","snowflake","socks","solar-panel","sort","sort-alpha-down","sort-alpha-up","sort-amount-down","sort-amount-up","sort-down","sort-numeric-down","sort-numeric-up","sort-up","spa","space-shuttle","spinner","splotch","spray-can","square","square-full","square-root-alt","stamp","star","star-and-crescent","star-half","star-half-alt","star-of-david","star-of-life","step-backward","step-forward","stethoscope","sticky-note","stop","stop-circle","stopwatch","store","store-alt","stream","street-view","strikethrough","stroopwafel","subscript","subway","suitcase","suitcase-rolling","sun","superscript","surprise","swatchbook","swimmer","swimming-pool","synagogue","sync","sync-alt","syringe","table","table-tennis","tablet","tablet-alt","tablets","tachometer-alt","tag","tags","tape","tasks","taxi","teeth","teeth-open","terminal","text-height","text-width","th","th-large","th-list","theater-masks","thermometer","thermometer-empty","thermometer-full","thermometer-half","thermometer-quarter","thermometer-three-quarters","thumbs-down","thumbs-up","thumbtack","ticket-alt","times","times-circle","tint","tint-slash","tired","toggle-off","toggle-on","toolbox","tooth","torah","torii-gate","trademark","traffic-light","train","transgender","transgender-alt","trash","trash-alt","tree","trophy","truck","truck-loading","truck-monster","truck-moving","truck-pickup","tshirt","tty","tv","umbrella","umbrella-beach","underline","undo","undo-alt","universal-access","university","unlink","unlock","unlock-alt","upload","user","user-alt","user-alt-slash","user-astronaut","user-check","user-circle","user-clock","user-cog","user-edit","user-friends","user-graduate","user-lock","user-md","user-minus","user-ninja","user-plus","user-secret","user-shield","user-slash","user-tag","user-tie","user-times","users","users-cog","utensil-spoon","utensils","vector-square","venus","venus-double","venus-mars","vial","vials","video","video-slash","vihara","volleyball-ball","volume-down","volume-off","volume-up","walking","wallet","warehouse","weight","weight-hanging","wheelchair","wifi","window-close","window-maximize","window-minimize","window-restore","wine-glass","wine-glass-alt","won-sign","wrench","x-ray","yen-sign","yin-yang"]
}
