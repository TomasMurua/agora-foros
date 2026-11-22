#set( $symbol_pound = '#' )
#set( $symbol_dollar = '$' )
#set( $symbol_escape = '\' )
package ${package};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Punto de entrada del microservicio ${artifactId}. */
@SpringBootApplication
public class ${nombreServicio}Application {

    public static void main(String[] args) {
        SpringApplication.run(${nombreServicio}Application.class, args);
    }
}
