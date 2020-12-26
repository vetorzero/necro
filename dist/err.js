"use strict";
// // Cria um novo objeto que herda o construtor de Error através do prototype.
// function MeuErro(message) {
//   this.name = "MeuErro";
//   this.message = message || "Mensagem de erro padrão";
//   this.stack = new Error().stack;
// }
// MeuErro.prototype = Object.create(MeuErro.prototype);
// MeuErro.prototype.constructor = MeuErro;
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var OutroErro = /** @class */ (function (_super) {
    __extends(OutroErro, _super);
    function OutroErro() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return OutroErro;
}(Error));
// try {
//   throw new MeuErro();
// } catch (e) {
//   console.log(e.name); // 'MeuErro'
//   console.log(e.message); // 'Mensagem de erro padrão'
// }
try {
    throw new OutroErro("Mensagem customizada");
}
catch (e) {
    console.log(e instanceof OutroErro);
    console.log(e.name); // 'MeuErro'
    console.log(e.message); // 'Mensagem customizada'
}
