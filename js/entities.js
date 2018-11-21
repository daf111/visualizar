'use strict';

/******************************************
Class Capa
******************************************/
class Capa {
	constructor(nombre, titulo, srs, host, servicio, minx, maxx, miny, maxy, attribution) {
		this.nombre = nombre
		this.titulo = titulo
		this.srs = srs
		this.host = host
		this.servicio = servicio
		this.minx = minx
		this.maxx = maxx
		this.miny = miny
		this.maxy = maxy
		this.attribution = attribution
	}
}

/******************************************
Strategy para imprimir
******************************************/
class Impresor {
	imprimir(itemComposite) {
		return '';
	}
}

class ImpresorItemHTML extends Impresor {
	imprimir(itemComposite) {
		
		var childId = itemComposite.getChildId();
		
		return "<li id='" + childId + "' class='capa list-group-item' onClick='gestorMenu.muestraCapa(\"" + childId + "\")'><a nombre=" + itemComposite.nombre +
			" href='#'>" + (itemComposite.titulo ? itemComposite.titulo.replace(/_/g, " ") : "por favor ingrese un nombre") + "</a></li>"; // Replace all "_" with a " "
			
	}
}

class ImpresorGrupoHTML extends Impresor {
	imprimir(itemComposite) {
		
		var listaId = "lista-" + itemComposite.seccion;
		var itemClass = 'menu5';
		
		return "<div id='" + listaId + "' class='" + itemClass + " panel-heading' title='" + itemComposite.descripcion + "' >" +
			"<div class='panel-title'>" +
			"<a data-toggle='collapse' href='#" + itemComposite.seccion + "'>" + itemComposite.nombre + "</a></div>" +
			"<div id='" + itemComposite.seccion + "' class='panel-collapse collapse'><ul class='list-group nav-sidebar'>" + itemComposite.itemsStr + "</ul></div></div>";
		
	}
}

/******************************************
Composite para menu
******************************************/
class ItemComposite {
	constructor(nombre, seccion, palabrasClave, descripcion) {
		this.nombre = nombre
		this.seccion = seccion
		this.palabrasClave = palabrasClave
		this.descripcion = descripcion
		this.impresor = null
	}

	setImpresor(impresor) {
		this.impresor = impresor
	}

	imprimir() {
		return this.impresor.imprimir(this);
	}
}

class ItemGroup extends ItemComposite {
	constructor(nombre, seccion, peso, palabrasClave, descripcion, callback) {
		super(nombre, seccion, palabrasClave, descripcion);
		this.peso = peso;
		this.itemsComposite = {};
		this.callback = callback;
	}
	
	setItem(itemComposite) {
		//this.itemsComposite.push(itemComposite);
		this.itemsComposite[itemComposite.seccion] = itemComposite;
	}
	
	ordenaPorTitulo(a, b){
		var aName = a.titulo.toLowerCase();
		var bName = b.titulo.toLowerCase(); 
		return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
	}
	
	imprimir() {
		this.itemsStr = '';
		
		var itemsAux = new Array();
		for (var key in this.itemsComposite) {
			itemsAux.push(this.itemsComposite[key]);
		}
		
		itemsAux.sort(this.ordenaPorTitulo);
		
		for (var key in itemsAux) {
			this.itemsStr += itemsAux[key].imprimir();
		}
		return this.impresor.imprimir(this);
	}
}

class Item extends ItemComposite {
	constructor(nombre, seccion, palabrasClave, descripcion, titulo, capa) {
		super(nombre, seccion, palabrasClave, descripcion);
		this.titulo = titulo;
		this.capa = capa;
		this.visible = false;
	}
	getChildId() {
		var childId = "child-" + this.seccion;
		return childId;
	}
	showHide(callback) {
		$('#' + this.getChildId()).toggleClass('active');
		if (typeof callback === "function") {
			callback(this.capa.host, this.nombre);
		} else if (this.capa.servicio === "tms") {
			loadMapaBase(this.capa.host, this.capa.nombre, this.capa.attribution);
		} else {
			loadGeojson(this.capa.host, this.nombre);
		}
		this.visible = !this.visible;
	}
}

/******************************************
Gestor de menu
******************************************/
class GestorMenu {
	constructor() {
		this.items = {};
	}
	
	add(itemGroup) {
		var itemAux;
		if (!this.items[itemGroup.seccion]) {
			itemAux = itemGroup;
		} else {
			itemAux = this.items[itemGroup.seccion];
		}
		for (var key in itemGroup.itemsComposite) {
			itemAux.setItem(itemGroup.itemsComposite[key]);
		}
		this.items[itemGroup.seccion] = itemAux;
	}
	
	ordenaPorPeso(a, b){
		var aName = a.peso;
		var bName = b.peso; 
		return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
	}
	
	imprimir(objDOM) {
		
		const impresorGroup = new ImpresorGrupoHTML();
		
		$(".nav.nav-sidebar").html("");
		
		var itemsAux = new Array();
		for (var key in this.items) {
			itemsAux.push(this.items[key]);
		}
		itemsAux.sort(this.ordenaPorPeso);
		
		for (var key in itemsAux) {
			
			var itemComposite = itemsAux[key];
			
			itemComposite.setImpresor(impresorGroup);
			if ($('#' + itemComposite.seccion).length != 0) {
				eliminarSubItem(itemComposite.seccion);
			}
			$(".nav.nav-sidebar").append(itemComposite.imprimir());
			
		}
		
	}
	
	muestraCapa(itemSeccion) {
		for (var key in this.items) {
			var itemComposite = this.items[key];
			for (var key2 in itemComposite.itemsComposite) {
				var item = itemComposite.itemsComposite[key2];
				if (item.getChildId() == itemSeccion) {
					item.showHide(itemComposite.callback);
					break;
					break;
				}
			}
		}
	}
	
}

/*
const impresorGrupoHTML = new ImpresorGrupoHTML();
const impresorItemHTML = new ImpresorItemHTML();
var grupo = new ItemGroup('aaa', 'bbb', 'ccc', 'ddd');
grupo.setImpresor(impresorGrupoHTML);
var item = new Item('xxx', 'yyy', 'zzz', 'abc', 'ASDASD', 'bbb');
item.setImpresor(impresorItemHTML);
grupo.setItem(item);
//alert(grupo.imprimir());
*/