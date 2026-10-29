package com.openclassrooms.starterjwt.exception;

import com.openclassrooms.starterjwt.payload.response.MessageResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Gestion centralisée des exceptions levées par les controllers et les services.
 * Remplace les try/catch et les tests "if (x == null)" dupliqués dans chaque controller.
 *
 * Note sur les anciens codes 401 :
 * avant ce handler, une exception non attrapée dans un controller était redirigée par Spring
 * vers la page "/error". Or "/error" est protégée par la configuration de sécurité :
 * le client recevait donc un 401 (non authentifié) au lieu de la vraie erreur (400 ou 404).
 * En traitant ces exceptions ici, avant la redirection vers "/error", le bon code est renvoyé.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Ressource introuvable (session, utilisateur, professeur).
    // Avant : 404 quand le controller testait "null", mais 401 quand l'exception venait
    // du service (ex. participer à une session inconnue).
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Void> handleNotFound(NotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    // Requête incohérente (ex. participer deux fois à la même session, email déjà pris).
    // Avant : 401 pour les exceptions levées par SessionService.
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<MessageResponse> handleBadRequest(BadRequestException e) {
        if (e.getMessage() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(e.getMessage()));
    }

    // Action interdite (ex. supprimer le compte d'un autre utilisateur).
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Void> handleUnauthorized(UnauthorizedException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // Identifiant non numérique dans l'URL (ex. /api/session/abc).
    // Remplace les try/catch(NumberFormatException) des controllers.
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Void> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    // Corps de requête invalide (@Valid non respecté) ou JSON illisible.
    // Avant : 401 à cause de la redirection vers "/error" (voir note en tête de classe).
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<Void> handleInvalidBody(Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }
}
