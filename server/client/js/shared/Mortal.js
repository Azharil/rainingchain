//Player
//Check client/shared/mortalShare for player attributes information

if(!server){
	initPlayer = function(data){    //use data sent from server and default to create the player
		player = Mortal.template('player');
		for(var i in data.player){ player[i] = data.player[i]; }
		$("#chatUserName")[0].innerHTML = player.name + ': '; 
	}
}




selectInv = function(key,obj){
	List.main[key].temp.selectInv = obj;
	List.main[key].temp.reset.selectInv = 1;
}




//Mortal
Mortal = typeof Mortal !== 'undefined' ? Mortal : {};

Mortal.remove = function(mort){
	ActiveList.remove(mort);
	
	delete List.mortal[mort.id];
	delete List.all[mort.id]
}

Mortal.updateEquip = function(mort){
	//only update armor atm
	for(var k in Cst.element.list){	//Each Element
		var i = Cst.element.list[k];
		var sum = 0;
		for(var j in mort.equip.piece){	//Each Piece
			sum += mort.equip.piece[j].def[i] * mort.equip.piece[j].orb.upgrade.bonus;
		}
		mort.equip.def[i] = sum;
	}
}

Mortal.switchEquip = function(mort,name){
	var old = mort.equip.piece[Db.equip[name].piece];
	var equip = Db.equip[name];
	mort.equip.piece[equip.piece] = equip;
	
	Mortal.permBoost(mort,equip.piece,mort.equip.piece[equip.piece].boost);
	Mortal.updateEquip(mort);
	List.main[mort.id].invList.remove(name);
	List.main[mort.id].invList.add(old.id);
	
	if(Cst.equip.weapon.piece.indexOf(equip.piece) !== -1){
		Mortal.swapWeapon(mort,equip.piece);
	}
}

Mortal.swapWeapon = function(mort,piece){
	//Equip a weapon already present in the weaponList
	mort.weapon = mort.equip.piece[piece];
	
	Sprite.change(mort,mort.weapon.sprite);
	Mortal.permBoost(mort,'weapon',mort.weapon.boost);
}

Mortal.changeHp = function(mort,amount){
    Mortal.changeResource(mort,{hp:amount});
}

Mortal.changeResource = function(mort,heal){
	for(var i in heal){
		mort[i] += heal[i];
		mort[i] = Math.min(mort[i],mort.resource[i].max);
	}
}

Mortal.teleport = function(mort,x,y,map){
	//Teleport player. if no map specified, stay in same map.
	mort.x = x;
	mort.y = y;
	if(map){ mort.map = map; }
	ActiveList.remove(mort);	//need to con sider if needed or not
}

Mortal.update = {};
Mortal.update.mastery = function(player){
	for(var i in player.mastery){
		for(var j in player.mastery[i]){
			player.mastery[i][j].sum = Math.pow(player.mastery[i][j]['x'] * player.mastery[i][j]['*'],player.mastery[i][j]['^']) + player.mastery[i][j]['+'];
		}
	}
}

Mortal.update.def = function(player){
	for(var i in player.def){ player.def[i] = player.equip.def[i] * player.mastery.def[i].sum;}
}

Mortal.update.permBoost = function(player){
	player = typeof player === 'object' ? player : List.all[player];
	
	var pb = player.boost;
	
	//Reset to PermBase
	pb.custom = [];
	for(var i in pb.list){
		pb.list[i].base = pb.list[i].permBase;	
		pb.list[i].max = pb.list[i].permMax;
		pb.list[i].min = pb.list[i].permMin;
		pb.list[i].t = 1;
		pb.list[i].tt = 1;
		pb.list[i].p = 0;
		pb.list[i].pp = 0;
	}
	
	//Update Value
	for(var i in player.permBoost){	//i = Source (item)	
		for(var j in player.permBoost[i]){	//each indidual boost boost
			var b = player.permBoost[i][j];
			
			if(b.type === '+' || b.type === 'base'){pb.list[b.stat].p += b.value;}
			else if(b.type === '*'){pb.list[b.stat].t += b.value;}
			else if(b.type === '++'){pb.list[b.stat].pp += b.value;}
			else if(b.type === '**'){pb.list[b.stat].tt += b.value;}
			else if(b.type === 'min'){pb.list[b.stat].min = Math.max(pb.list[b.stat].min,b.value);}
			else if(b.type === 'max'){pb.list[b.stat].max = Math.min(pb.list[b.stat].max,b.value);}
			else if(b.type === 'custom'){ pb.custom[b.value] = 1; }
			
		}
	}
	
	//Max and min
	for(var i in pb.list){
		pb.list[i].base *= pb.list[i].t;
		pb.list[i].base += pb.list[i].p;
		pb.list[i].base *= pb.list[i].tt;
		pb.list[i].base += pb.list[i].pp;
	
		pb.list[i].base = Math.max(pb.list[i].base,pb.list[i].min);
		pb.list[i].base = Math.min(pb.list[i].base,pb.list[i].max);	
	}
	
	for(var j in pb.custom){ Db.customBoost[j].function(pb,player.id);}
}

Mortal.update.boost = function(player,stat){
	changeViaArray({'origin':player,'array':player.boost.list[stat].stat,'value':player.boost.list[stat].base});
	for(var i in player.boost.list[stat].name){
		var boost = player.boost.list[stat].name[i];
				
		if(boost.type === '+'){	addViaArray({'origin':player,'array':player.boost.list[stat].stat,'value':boost.value}); }
		else if(boost.type === '*'){	addViaArray({'origin':player,'array':player.boost.list[stat].stat,'value':(boost.value-1)*player.boost.list[stat].base}); }
	}
}

Mortal.boost = function(player, boost){
	//Add a boost to a mortal

	//list[i]: i = stat
	//toUpdate[i]: i = stat
	//fast[i]: i = stat@source

	// {stat:'dmgMain',value:1000,type:'*',time:10000,name:'quest'}

	//format: boost { 'stat':'dmgMain','value':1,'type':'*','time':100,'name':'weapon'}
	boost = arrayfy(boost);
	for(var i in boost){ 
		var b = boost[i];
		if(typeof player === 'string'){ player = List.all[player]; }
		var name = b.name || 'Im dumb.';
		var id = b.stat + '@' + name;
		b.time = b.time || 1/0;
		b.timer = b.time;		//otherwise, cuz reference, boost cant be used twice cuz time = 0
		b.type = b.type || '+';
		
		b.spd = 'reg';
		if(b.time > 250){ b.spd = 'slow'; }
		if(b.time < 25){ b.spd = 'fast'; }
		
		player.boost[b.spd][b.stat + '@' + name] = b;
		player.boost.list[b.stat].name[name] = b;
		player.boost.toUpdate[b.stat] = 1;
	}
	
}

Mortal.permBoost = function(mort,source,boost){
	if(boost){	
		boost = (boost instanceof Array) ? boost : [boost];
		mort.permBoost[source] = boost;
	} else { delete mort.permBoost[source]; }
	
	Mortal.update.permBoost(mort);
	Mortal.update.mastery(mort);
	Mortal.update.def(mort);
}

Mortal.permBoost.compile = function(b){
	var tmp = {};	var temp = [];
	
	for(var i in b){
		if(b[i].stat){
			var name = b[i].type + '--' + b[i].stat;
			if(tmp[name] === undefined){tmp[name] = {'type':b[i].type,'stat':b[i].stat,'value':0};}
			tmp[name].value += b[i].value;
		} else {
			tmp[b[i].value] = b[i];
		}
	}
	for(var i in tmp){temp.push(tmp[i]);}
	return temp;
}

Mortal.talk = function(mort,enemyId){
	if(List.all[enemyId].dialogue){
		List.all[enemyId].dialogue(mort.id);
	}
}

Mortal.removeAbility = function(mort,name){
	delete mort.abilityList[name];
	for(var i in mort.ability){
		if(mort.ability[i] && mort.ability[i].id === name){
			mort.ability[i] = null;
		}
	}
}

Mortal.swapAbility = function(mort,abPos,abListPost){
	var abl = mort.abilityList[abListPost];
	
	if(mort.type === 'player'){
		if(abPos === 4 && mort.abilityList[abListPost].type !== 'healing'){Chat.add(key,'This ability slot can only support Healing abilities.'); return;}	
		if(abPos === 5 && mort.abilityList[abListPost].type !== 'dodge'){Chat.add(key,'This ability slot can only support Dodge abilities.'); return;}	
	}
	
	mort.ability[abPos] = mort.abilityList[abListPost];
	mort.abilityChange = {'press':'000000000000000','charge':{}}
	for(var i in mort.ability){ 
		if(mort.ability[i]){
			mort.abilityChange.charge[mort.ability[i].id] = 0;
		}
	}

}

Mortal.learnAbility = function(mort,name){
	if(mort.abilityList[name]) return; //verify if already ahve
	
	var ab = Ability.uncompress(deepClone(Db.ability[name]));
		
	mort.abilityList[ab.id] = ab;
}

Mortal.selectPassive = function(mort,ii,jj){
	//when player wants to add a passive
	var key = mort.id;
	var main = List.main[key];
	if(main.passivePt === 0){ Chat.add(key,"You don't have any Passive Points to use."); return;}
	if(main.passive[ii][jj] === '1'){ Chat.add(key,"You already have this passive.");	return;}
	if(!Passive.test(main.passive,ii,jj)){Chat.add(key,"You can't choose this passive yet.");	return;}
	
	main.passivePt--;
	main.passive[ii] = main.passive[ii].slice(0,jj) + '1' + main.passive[ii].slice(jj+1);
	Mortal.permBoost(List.all[key],'Passive',Passive.convert(main.passive));
}

Mortal.death = function(mort){	//only for enemy atm
	mort.dead = 1;
	
	var killer = null; var max = 0;
	for(var i in mort.damagedBy){
		if(mort.damagedBy[i] > max){
			killer = i;
		}
	}
	Mortal.dropItem(mort,List.all[killer]);
	if(mort.death){ mort.death(killer); }	//custom death function (ex quest)
	
	ActiveList.remove(mort);
}

Mortal.death.start = function(mort){
	mort.killed = 1;
	mort.maxSpd = 0;
	mort.spdX = 0;
	mort.spdY = 0;
	Sprite.change(mort,{'anim':'Death'});
	//death(enemy);
}

Mortal.revive = function(mort){
	//mort.extra.id = mort.id
	//addEnemy(mort.data,mort.extra)
}

Mortal.dropItem = function(mort,killer){
	var drop = mort.drop;
	
	var quantity = drop.mod.quantity; 
	var quality = drop.mod.quality;
	var rarity = drop.mod.rarity;
	if(killer){ 
		quantity += killer.item.quantity; 
		quality += killer.item.quality; 
		rarity += killer.item.rarity; 
	}
	
	
	
	for(var i in drop.category){
	
		if(drop.category[i] !== 'plan'){
			var list = Db.drop[drop.category[i]];
			for(var j in list){
				var item = list[j];
				if(Math.pow(Math.random(),quantity+1) < item.chance){
					var amount = Math.floor(item.min + (item.max-item.min)*( Math.pow(Math.random(),1/(quantity+1)))) ;	//player quantity
					Drop.creation({'x':mort.x+(Math.random()-0.5)*50,'y':mort.y+(Math.random()-0.5)*50,'map':mort.map,'item':item.item,'amount':amount,'timer':Drop.timer});		
				}	
			}
		} else {
			if(Math.pow(Math.random(),(quantity+1)) < Db.drop.plan){
				var itemId = 'planA' + Math.randomId();
				var item = {'name':"Plan",'visual':'plan.planA',
							'option':[	{'name':'Craft Item','func':'Craft.plan',
										'param':[{'lvl':Math.max(0,Math.floor(mort.lvl*1+(Math.random()-0.5)*15)),'rarity':rarity,'quality':quality},{'item':[{'item':itemId,'amount':1}]}]}
							]};
				
				
				item.id = itemId;
				Item.creation(item);
				
				Drop.creation({'x':mort.x+(Math.random()-0.5)*50,'y':mort.y+(Math.random()-0.5)*50,'map':mort.map,'item':itemId,'amount':1,'timer':Drop.timer});		
			}
		}
	}
}

Mortal.pickDrop = function (mort,id){
	var main = List.main[mort.id];
	var drop = List.drop[id];
		
	if(drop){
		if(distancePtPt(mort,drop) <= mort.pickRadius && main.invList.test([[List.drop[id].item,List.drop[id].amount]])){
			main.invList.add(drop.item,drop.amount);
			Drop.remove(drop);		
		}
	}
}

Mortal.rightClickDrop = function(mort,rect){
	var key = mort.id;
	var ol = {'name':'Pick Items','option':[]};
	for(var i in List.drop){
		var d = List.drop[i];
		if(d.map == List.all[key].map && Collision.RectRect(rect,[d.x,d.x+32,d.y,d.y+32]) ){
			ol.option.push({'name':'Pick ' + Db.item[List.drop[i].item].name,'func':'pickDrop','param':[i]});
		}
	}
	
	if(ol.option){ 
		Button.optionList(key,ol);  
	}	
}
	
Mortal.dropInv = function(mort, iii){
	var key = mort.id;
	var item = Db.item[iii];
	var player = List.all[key];
	var amount = 1;
	if(item.stack){ amount = List.main[key].invList.have(iii,'amount'); }
	
	Drop.creation({'x':player.x,'y':player.y,'map':player.map,'item':iii,'amount':amount,'timer':25*30});
	List.main[key].invList.remove(iii,amount);
}










