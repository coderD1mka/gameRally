/**
 * Created by SteelMan on 19.06.2017.
 */
	// Псевдонимы
	var Sprite=PIXI.Sprite;
	var loader=PIXI.loader;
	//Глобальные переменные
	//var app=new PIXI.Application(800,600,{backgroundColor:0x000000});
	// размер игрового поля ( отображаемого)
	var gameWidth=12*128;	//12 блоков по ширине
	var gameHeight=7*128;	// 7 по высоте
	//размеры карты в пикселах
	var mapWidth=20*128;
	var mapHeight=20*128;
	// игровые объекты расширяющие объект Sprite ( например машины)
	 

	//Игровой менеджер
gameManager={
	app:undefined,              // объект PIXI приложения
	mapContainer:undefined,     // контейнер для карты 20х20 (400 спрайтов) и трассы(400 спрайтов)
	objectContainer:undefined,  // контейнер для игровых объектов (10 спрайтов)
	mode:function () {},        // ссылка на функцию текущего режима игры (вызывается в eachFrame() )
	objects:{},	                //массив  объектов
	view:{	                    // окно просмотра карты
		x:0*128,
		y:0*128, width:gameWidth, height:gameHeight
	},

	loadAll:function(){
			// загрузка изображения всех элементов на всех картах
			loader.add("images/roadTilesAtlas.json").load(function(){mapManager.onLoadMapTextures();});
			// загрузка конкретной карты
		 	mapManager.loadMap("images/roadMap2.json"); 

		 	
	},
	// Инициализация приложения
	init:function () {
		if (!mapManager.isLoadMapTextures || !mapManager.isLoadMap 
				|| !spriteManager.isLoadCarTextures)  //если карта или текстуры не загрузились то
		{
			setTimeout(function(){gameManager.init();}, 100);	// вызов инициализации снова
			return;
		}

		// выбираем CanvasRenderer
		this.app=new PIXI.Application(gameWidth,gameHeight,{backgroundColor:0x000000, forceCanvas:true});

		// ParticleContainer быстрей отрисовывается, чем просто Container 
		this.mapContainer=new PIXI.particles.ParticleContainer();//new PIXI.particles.ParticleContainer();	new PIXI.Container()    
		this.objectContainer=new PIXI.particles.ParticleContainer();//new PIXI.particles.ParticleContainer(); new PIXI.Container()


			document.body.appendChild(this.app.view);

			//выводим карту в контейнер для быстрого рендера
			for(var i=0; i<mapManager.backgroundMap.length; ++i)
			{
				if(!mapManager.mapSprites[i]) continue;
				this.mapContainer.addChild(mapManager.mapSprites[i]);
			}	

			//выводим трассу в контейнер для быстрого рендера
			for(   i=0; i<mapManager.roadMap.length; ++i)
			{
				if(!mapManager.roadSprites[i]) continue;
				this.mapContainer.addChild(mapManager.roadSprites[i]);
			}	

			//добавили контейнер с картой в главный контейнер
			this.app.stage.addChild(this.mapContainer);

			

			// выводим машину
			//добавили автомобиль в массив объектов и  контейнер рендера
			var count=1;
			var baseX=3;
			var baseY=4;
			var car;
			for(var p in mapManager.objects){
				this.addObj(p,spriteManager.carTextures[count],
				            Car({x:baseX*128, y:baseY*128}));
				car=this.objects[p];
				//car.move=moveCar;
				car.speed=count*2;
				car.rotation=Math.PI/2;
				++count;
				++baseY;
			}
			var player=this.objects['player'];
			player.x=128*4;
			player.y=128*4;
			player.speed=10;
			console.log(player);
			//player.rotation=Math.PI/2;
			//player.move=moveCar;

			
			//this.addObj("Jack",spriteManager.carTextures[2],Car({x:50,y:150}));
			
			//this.mySprite[2]=new PIXI.Text("Road in Fire",{fontSize:32,fill:0xFF2020});

			//добавили контейнер с объектами в главный контейнер
			
			this.app.stage.addChild(this.objectContainer);

			this.mode = this.play;	// установили режим игры
		//установили функцию вызываемую каждый кадр
			this.app.ticker.add(gameManager.eachFrame);
	},
	// Функция исполняемая каждый кадр
	eachFrame:function () {

		// Запускаем функцию текущего режима игры каждый кадр
		gameManager.mode();

	},
	
	// Режим игры 
	play:function () {

		
		//var player=this.objects['player'];

		//player.move();
		for (var p in this.objects)
		{
			this.demoMove(p);
			this.objects[p].x=this.objects[p].x;
			this.objects[p].y=this.objects[p].y;
		}

		this.centeredView();

	},
	// демка движения машины игрока
	demoMove:function(sprite)
	{
		var player=this.objects[sprite];

		if(player.mode===1)
		{
			player.move();
			if(player.x>=mapWidth-this.view.width/2)
			{
				player.mode=2;
				player.rotation=Math.PI+Math.PI/20; //вниз
			}
		}
		else if(player.mode===2)
		{
			player.move();
			if(player.y>=mapHeight-this.view.height/2)
			{
				player.mode=3;
				player.rotation=Math.PI+Math.PI/2+Math.PI/20; // влево
			}
		}
		else if(player.mode===3)
		{
			player.move();
			if(player.x<=this.view.width/2)
			{
				player.mode=4;
				player.rotation=0+Math.PI/20; // вверх
			}
		}
		else if(player.mode===4)
		{
			player.move();
			if(player.y<=this.view.height/2)
			{
				player.mode=1;
				player.rotation=Math.PI/2+Math.PI/20; //вправо
			}
		}
	},

	//центровка окна просмотра по машине игрока
	centeredView:function()
	{
		var shiftX=this.objects['player'].x-Math.floor(gameWidth/2);
		var shiftY=this.objects['player'].y-Math.floor(gameHeight/2);
		var shiftFromRight=mapWidth-this.view.width;
		var shiftFromUp=mapHeight-this.view.height;

		this.view.x=shiftX;
		this.view.y=shiftY;
		
		if(shiftX<0)
		{
			this.view.x=0;
		}else if(shiftX> shiftFromRight)
		{
			this.view.x=shiftFromRight;
		}

		if(shiftY<0)
		{
			this.view.y=0;
		}
		else if(shiftY>shiftFromUp)
		{
			this.view.y=shiftFromUp;
		}

		this.app.stage.x=-this.view.x;
		this.app.stage.y=-this.view.y;
	},
	// Создание объекта игры
	addObj:function( name,texture,extendObj) // текстура, объект расширяющий объект Sprite
	{
		var object=new Sprite(texture);
		for(var prop in extendObj)
		{
			if(object.hasOwnProperty(prop) || typeof(object[prop])==='undefined')
			{
				// добавили свойство в новый объект если его не было в родительском
				// или изменили значение свойства, если такое есть в родительском
				object[prop]=extendObj[prop]; 
			}
		}
		// точку вращения установим по центру спрайта
		object.pivot.x=20;
		object.pivot.y=35;
		
		this.objects[name]=object;	// поместили в массив на хранение
		this.objects[name].x=extendObj.x || 0;
		this.objects[name].y=extendObj.y || 0;
		this.objects[name].move=moveCar;
		this.objectContainer.addChild(object); // поместили в слой рендера
	}
};

	//Менеджер карты
mapManager={
	backgroundMap:[],   //---переменная для хранения заднего фона карты (0 - пусто, другие числа номера спрайтов карты)
	roadMap:[],			// карта трассы
	mapSprites:[],	// массив представляющий карту из объектов Sprite
	roadSprites:[], // массив спрайтов трассы
	
	mapTextures:[], // массив всех текстур используемых в картах игры
	objects:{},		// объекты на карте
	isLoadMapTextures:false, //флаг того, что все изображения загружены
	isLoadMap:false, 	// флаг-индикатор загрузки(разбора) данных карты

	collision:function(sprite)
	{
		var isRoad;

		var shift=45;   //смещение относительно центра спрайта (машины)
		// если sprite.rotation=0 , то PIXI за координаты спрайта берет 
		// левый верхний угол спрайта, иначе центр спрайта (точнее pivot point)
		if(!sprite.rotation) shift=10; 
		// переводим координаты спрайта в координаты карты
		var mapX=Math.floor((sprite.x-shift)/128);
		var mapY=Math.floor((sprite.y-shift)/128);


		if(this.roadMap[mapX+mapY*20]) //если есть какой-нибудь элемент дороги,
			isRoad=true; //  	то возвращаем false
		else
			isRoad=false; // дороги нет, значит произошло столкновение с бортом дороги

		if(!isRoad) return true;

		mapX=Math.floor((sprite.x+45)/128);
		mapY=Math.floor((sprite.y+45)/128);

		if(this.roadMap[mapX+mapY*20]) //если есть какой-нибудь элемент дороги,
			return false; //  	то возвращаем false
		else
			return true; //

	},
	// создаем массив копию карты, но вместо номеров спрайтов сами спрайты
	_makeSpriteMap:function(){

		if(!this.isLoadMapTextures)
		{
			setTimeout(function(){mapManager._makeSpriteMap();}, 200);
			return;
		}

		var textureNumber; // нумерация спрайтов начинается с единицы
		this.mapSprites.length=0; // на всякий случай обнуляем массив

		var index;

			for(var i=0; i<20; ++i)
			{
				for(var j=0; j<20;++j) {
					index=i+j*20;
					if(!(textureNumber=this.backgroundMap[index]))
					{ 
						this.mapSprites[index]=0; // 
						continue; // пропускаем нулевые значения
					}
					// создаем новый спрайт из текстуры
					this.mapSprites[index]=new Sprite(this.mapTextures[textureNumber]);
					this.mapSprites[index].x=i*128; // задаем позицию спрайта на экране
					this.mapSprites[index].y=j*128;
				}
			}
			// тоже для трассы
			this.roadSprites.length=0;
			for(var i=0; i<20; ++i)
			{
				for(var j=0; j<20;++j) {
					index=i+j*20;

					// создание спрайтов для трассы
					if(!(textureNumber=this.roadMap[index]))
					{
						this.roadSprites[index]=0;
						continue;
					}
					// создаем новый спрайт из текстуры
					this.roadSprites[index]=new Sprite(this.mapTextures[textureNumber]);
					this.roadSprites[index].x=i*128; // задаем позицию спрайта на экране
					this.roadSprites[index].y=j*128;
				}
			}


			this.isLoadMap=true;
	},
	// загрузка карты
	loadMap:function(fName){	// функция загрузки данных карты в формате JSON
		// загрузка карты в формате JSON
		var request=new XMLHttpRequest();

		request.onreadystatechange=function(){
			//проверка статуса запроса
			if(request.readyState===4 && request.status===200)
			{
				//загрузка файла карты прошла успешно
				console.log("загрузка файла карты прошла успешно");
				mapManager.parseMap(request.responseText);
			}
		};
		request.open("GET",fName,true);

		request.send();
	},

	// Разбор карты в формате JSON
	parseMap:function(mapJSON){

		var mapObject=JSON.parse(mapJSON); // конвертация из JSON в объект JavaScript

		this.backgroundMap=mapObject.layers[0].data; //  взяли массив элементов карты (это и есть сама карта вобщем)
		this.roadMap=mapObject.layers[1].data;	// карта трассы
		this._makeSpriteMap(); // создаем карту из спрайтов по номерам спрайтов в backgroundMap[] и roadMap[]

		// извлекаем данные по расположению машин на карте
		var properties=mapObject.layers[1].properties;
		for( var k in properties)
			properties[k]=this.getObject(properties[k]);
		this.objects=properties;
	},
	getObject:function(str)
	{
		var obj={};
		var index=str.indexOf('x')+2;
		obj.x=parseInt(str.substring(index,index+2));
		var index=str.indexOf('y')+2;
		obj.y=parseInt(str.substring(index,index+2));
		return obj;

	},
	
	onLoadMapTextures:function(){   //сюда попадаем, когда изображение загружено и аталас разобран
		console.log("Все спрайты загружены!");

		//теперь копируем текстуры спрайтов в массив
			var id = loader.resources["images/roadTilesAtlas.json"].textures;

			if(this.mapTextures.length) return; // если массив текстур не пустой, то выход

			this.mapTextures.push(0);	//текстуры с номером ноль нет

			for (var key in id) {
				this.mapTextures.push(id[key]); //добавили текстуру в массив
			}
			console.log("Длина массива текстур: " + this.mapTextures.length);
			this.isLoadMapTextures=true;    //установка флага загрузки всех текстур

			//загрузка изображений машин
		 	loader.add("images/carTilesAtlas.json").load(function(){spriteManager.onLoadCars();});
	} // end onLoadMapTextures()
	
};  // end mapManager


spriteManager={
		carTextures:[],	//текстуры машин
		isLoadCarTextures:false, //флаг того, что все изображения загружены
	
	onLoadCars:function(){
		// по загрузке спрайтов машин
		//теперь копируем текстуры спрайтов в массив
			var id = loader.resources["images/carTilesAtlas.json"].textures;

			if(this.carTextures.length) return; // если массив текстур не пустой, то выход

			this.carTextures.push(0);	//текстуры с номером ноль нет

			for (var key in id) {
				this.carTextures.push(id[key]); //добавили текстуру в массив
			}
			console.log("Тестуры машин загружены");
			this.isLoadCarTextures=true;    //установка флага загрузки всех текстур
	}
};

gameManager.loadAll(); // загрузка всех ресурсов

gameManager.init(); //функция инициализации запускает игровой цикл

// ----------- Общие функции -------------------
var Point={x:0,y:0};

function Car(obj){ // инициализация объекта Car объектом-параметром или значения по умолчанию
		var parent={
			x:0,	//глобальные координаты [x,y]
			y:0,
			vx:0,
			vy:0,
			speed:0,
			angle:0, // угол поворота
			fuel:100,
			mode:1
		};	

		parent.x= obj.x || 0;
		parent.y= obj.y || 0;
		parent.vx= obj.vx || 0;
		parent.vy=obj.vy || 0;
		parent.speed=obj.speed || 0;
		parent.fuel=obj.fuel || 100;

		return parent;
};

function moveCar(){

	var oldx=this.x;
	var oldy=this.y;

	this.vx=Math.sin(this.rotation)*this.speed;
	this.vy=-Math.cos(this.rotation)*this.speed;

	this.x+=this.vx;
	this.y+=this.vy;

	if(mapManager.collision(this)) // если выход за пределы дороги
	{
		this.x=oldx;	// то восстановили исходные координаты (до перемещения)
		this.y=oldy;
		this.speed=0;
	}

}

// структура CheckPoint для проверки прохождения трассы машинами (для каждой машины своя)
function CheckPoint( checkPointArray) // на входе массив чекпоинтов для данной карты
{
	this.checkPoints=checkPointArray;
};
// функция проверяющая прохождение чекпоинтов
CheckPoint.prototype.check=function(){
		//цикл по всем чекпоинтам
		var i, checkP;
		for( i=0; i<this.checkPoints.length; ++i)
		{
			checkP=this.checkPoints[i];

			if(!checkP.checked)    // если этот чекпоинт еще не пройден
			{
				// то проверяем прохождение этой точки
				return;
			}
		}// end for

		// если попали сюда значит все чекпоинты пройдены, достигнут конец трассы
		console.log("трасса пройдена");
};

// объкт представляющий один чекпоинт
var checkObj={
	x1:0, y1:0, x2:0, y2:0, // координаты чекпоинта
	checked:false // флаг показывающий был ли проехан этот чекпоинт
};

// пересчет из глобальных координат в локальные
function globalToLocal(Point)
{

}

